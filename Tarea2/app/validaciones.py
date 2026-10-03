import calendar
import re
from datetime import date, datetime, timedelta
from sqlalchemy import func

from db import db
from models import Ave, Comuna, Region, Voluntario

REGEX_NOMBRE = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:[-'][A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$")
REGEX_EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
REGEX_TELEFONO = re.compile(r"^\+569\d{8}$")

FORMATOS_ADMITIDOS = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
    "video/mp4": {".mp4"},
    "video/webm": {".webm"},
}
MAX_ARCHIVOS = 5


def fecha_minima_permitida():
    hoy = date.today()
    mes_anterior = hoy.month - 1
    anio_anterior = hoy.year
    if mes_anterior == 0:
        mes_anterior = 12
        anio_anterior -= 1
    try:
        return date(anio_anterior, mes_anterior, hoy.day)
    except ValueError:
        return date(anio_anterior, mes_anterior, calendar.monthrange(anio_anterior, mes_anterior)[1])


def es_archivo_valido(archivo):
    extension = ""
    if "." in archivo.filename:
        extension = "." + archivo.filename.rsplit(".", 1)[-1].lower()
    return archivo.mimetype in FORMATOS_ADMITIDOS and extension in FORMATOS_ADMITIDOS[archivo.mimetype]


def validar_voluntario(form):
    errores = {}
    datos = {
        "nombre": form.get("nombre_voluntario", "").strip(),
        "apellido_paterno": form.get("apellido_paterno", "").strip(),
        "apellido_materno": form.get("apellido_materno", "").strip(),
        "email": form.get("email_voluntario", "").strip(),
        "telefono": form.get("telefono_voluntario", "").strip(),
        "region": form.get("region", "").strip(),
        "comuna": form.get("comuna", "").strip(),
    }
    for campo in ("nombre", "apellido_paterno", "apellido_materno"):
        if not datos[campo]:
            errores[campo] = "Este campo es obligatorio."
        elif len(datos[campo]) > 50:
            errores[campo] = "Máximo 50 caracteres."
        elif not REGEX_NOMBRE.match(datos[campo]):
            errores[campo] = "Solo una palabra, con letras, guion o apóstrofe."

    if not datos["email"]:
        errores["email"] = "El correo electrónico no puede quedar vacío."
    elif len(datos["email"]) > 80 or not REGEX_EMAIL.match(datos["email"]):
        errores["email"] = "Ingrese un correo electrónico válido."
    else:
        ya_existe = db.session.query(Voluntario).filter(func.lower(Voluntario.email) == datos["email"].lower()).first()
        if ya_existe:
            errores["email"] = "Este correo ya está registrado como voluntario."

    if not REGEX_TELEFONO.match(datos["telefono"]):
        errores["telefono"] = "El teléfono debe tener el formato +56912345678."

    if not datos["region"]:
        errores["region"] = "Debe seleccionar una región."
    elif not db.session.get(Region, datos["region"]):
        errores["region"] = "La región seleccionada no es válida."

    if not datos["comuna"]:
        errores["comuna"] = "Debe seleccionar una comuna."
    elif datos["region"]:
        comuna = db.session.get(Comuna, datos["comuna"])
        if not comuna or str(comuna.region_id) != datos["region"]:
            errores["comuna"] = "La comuna seleccionada no pertenece a la región."

    return errores, datos


def validar_avistamiento(form, archivos):
    errores = {}
    hoy = date.today()
    fecha_minima = fecha_minima_permitida()
    datos = {
        "email": form.get("email_voluntario", "").strip().lower(),
        "region": form.get("region", "").strip(),
        "comuna": form.get("comuna", "").strip(),
        "lugar": form.get("sector", "").strip(),
        "nombre_ave": form.get("nombre_ave", "").strip(),
        "fecha": form.get("fecha_avistamiento", "").strip(),
        "hora": form.get("hora_avistamiento", "").strip(),
    }

    voluntario = None
    if not datos["email"]:
        errores["email"] = "El email del voluntario no puede quedar vacío."
    elif not REGEX_EMAIL.match(datos["email"]):
        errores["email"] = "Ingrese un email válido."
    else:
        voluntario = db.session.query(Voluntario).filter(func.lower(Voluntario.email) == datos["email"]).first()
        if not voluntario:
            errores["email"] = "Este email no está registrado como voluntario."

    if not datos["region"]:
        errores["region"] = "Debe seleccionar una región."
    elif not db.session.get(Region, datos["region"]):
        errores["region"] = "La región seleccionada no es válida."

    comuna = None
    if not datos["comuna"]:
        errores["comuna"] = "Debe seleccionar una comuna."
    elif datos["region"]:
        comuna = db.session.get(Comuna, datos["comuna"])
        if not comuna or str(comuna.region_id) != datos["region"]:
            errores["comuna"] = "La comuna seleccionada no pertenece a la región."

    if len(datos["lugar"]) > 200:
        errores["lugar"] = "El lugar no puede superar los 200 caracteres."

    if not datos["nombre_ave"]:
        errores["nombre_ave"] = "El nombre del ave es obligatorio."
    elif len(datos["nombre_ave"]) > 80:
        errores["nombre_ave"] = "El nombre del ave no puede superar los 80 caracteres."

    ave = None
    if datos["nombre_ave"] and "nombre_ave" not in errores:
        ave = db.session.query(Ave).filter(func.lower(Ave.nombre) == datos["nombre_ave"].lower()).first()
        if not ave:
            errores["nombre_ave"] = "El ave no está en el catálogo registrado."

    fecha = None
    if not datos["fecha"]:
        errores["fecha"] = "La fecha del avistamiento es obligatoria."
    else:
        try:
            fecha = date.fromisoformat(datos["fecha"])
            if fecha > hoy or fecha < fecha_minima:
                errores["fecha"] = "La fecha debe estar dentro del último mes y no puede ser futura."
        except ValueError:
            errores["fecha"] = "Fecha inválida."

    hora_obj = None
    if not datos["hora"]:
        errores["hora"] = "La hora del avistamiento es obligatoria."
    else:
        try:
            hora_obj = datetime.strptime(datos["hora"], "%H:%M").time()
            if fecha == hoy and datetime.combine(fecha, hora_obj) > datetime.now():
                errores["hora"] = "La hora no puede ser futura."
        except ValueError:
            errores["hora"] = "Hora inválida."

    if not archivos or archivos[0].filename == "":
        errores["evidencia"] = "Debes adjuntar al menos una foto o video."
    elif len(archivos) > MAX_ARCHIVOS:
        errores["evidencia"] = "Debes adjuntar entre 1 y 5 fotos o videos."
    else:
        for archivo in archivos:
            if not es_archivo_valido(archivo):
                errores["evidencia"] = "Cada archivo debe ser JPG, PNG, WEBP, MP4 o WEBM."
                break

    fecha_hora = None
    if fecha and hora_obj and not errores:
        fecha_hora = datetime.combine(fecha, hora_obj)

    contexto = {"voluntario": voluntario, "ave": ave, "comuna": comuna, "fecha_hora": fecha_hora}
    return errores, datos, contexto