import os
import uuid
from datetime import datetime

from flask import Flask, abort, flash, jsonify, redirect, render_template, request, url_for
from sqlalchemy import func, or_

from db import db
from models import Ave, Avistamiento, Comuna, Region, Registro, Voluntario
from validaciones import REGEX_EMAIL, validar_avistamiento, validar_voluntario

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(app.static_folder, "uploads")
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024
app.secret_key = "tarea2-cc5002-desarrollo-web"
db.init_app(app)

AVISTAMIENTOS_POR_PAGINA = 6

CATEGORIAS_AVES = {
    "urbanas_jardin": ["zorzal", "chincol", "gorrión", "paloma", "tordo", "diuca"],
    "pajaros_canto": ["chucao", "loica", "tijeral", "turca", "rayadito", "chingolo", "jilguero"],
    "rapaces_carroneras": ["cóndor", "águila", "aguilucho", "peuco", "cernícalo", "jote", "lechuza", "búho", "halcón"],
    "acuaticas_nadadoras": ["pato", "cisne", "tagua", "pimpollo", "huairavo", "cormorán"],
    "zancudas_orilla": ["garza", "flamenco", "queltehue", "zarapito", "pilpilén", "chorlo"],
    "marinas_pelagicas": ["pingüino", "albatros", "fardela", "gaviota", "golondrina de mar", "pelícano"],
    "carpinteros_trepadores": ["carpintero", "pitío", "comebo", "trepador"],
    "perdices_terrestres": ["perdiz", "tórtola", "codorniz"],
}


def comunas_por_region():
    comunas = db.session.query(Comuna).order_by(Comuna.nombre).all()
    agrupadas = {}
    for comuna in comunas:
        agrupadas.setdefault(str(comuna.region_id), []).append({"id": comuna.id, "nombre": comuna.nombre})
    return agrupadas


@app.route("/")
def portada():
    ultimos = (
        db.session.query(Avistamiento)
        .order_by(Avistamiento.id.desc())
        .limit(2)
        .all()
    )
    return render_template("index.html", ultimos=ultimos)


@app.route("/voluntario", methods=["GET", "POST"])
def registrar_voluntario():
    regiones = db.session.query(Region).order_by(Region.nombre).all()
    errores = {}
    datos = {}
    if request.method == "POST":
        errores, datos = validar_voluntario(request.form)
        if errores:
            return render_template(
                "volunteer_register.html",
                regiones=regiones, comunas_por_region=comunas_por_region(), errores=errores, datos=datos,
            )
        comuna = db.session.get(Comuna, datos["comuna"])
        voluntario = Voluntario(
            nombre=f"{datos['nombre']} {datos['apellido_paterno']} {datos['apellido_materno']}",
            email=datos["email"],
            telefono=datos["telefono"],
            fecha_registro=datetime.now(),
            comuna_id=comuna.id,
        )
        db.session.add(voluntario)
        db.session.commit()
        flash("¡Voluntario registrado con éxito!", "exito")
        return redirect(url_for("portada"))
    return render_template(
        "volunteer_register.html",
        regiones=regiones, comunas_por_region=comunas_por_region(), errores=errores, datos=datos,
    )


@app.route("/avistamiento", methods=["GET", "POST"])
def registrar_avistamiento():
    regiones = db.session.query(Region).order_by(Region.nombre).all()
    aves = db.session.query(Ave).order_by(Ave.nombre).all()
    errores = {}
    datos = {}
    mostrar_acceso = True
    error_acceso = ""
    email_validado = ""
    if request.method == "POST":
        archivos = request.files.getlist("evidencia")
        errores, datos, contexto = validar_avistamiento(request.form, archivos)
        if errores:
            if "email" in errores:
                mostrar_acceso = True
                error_acceso = errores["email"]
            else:
                mostrar_acceso = False
                email_validado = datos["email"]
            return render_template(
                "avistamiento_register.html",
                regiones=regiones, comunas_por_region=comunas_por_region(), aves=aves,
                errores=errores, datos=datos, mostrar_acceso=mostrar_acceso,
                error_acceso=error_acceso, email_validado=email_validado,
            )
        avistamiento = Avistamiento(
            voluntario_id=contexto["voluntario"].id,
            ave_id=contexto["ave"].id,
            comuna_id=contexto["comuna"].id,
            fecha_hora=contexto["fecha_hora"],
            lugar=datos["lugar"],
        )
        db.session.add(avistamiento)
        db.session.flush()
        for archivo in archivos:
            extension = archivo.filename.rsplit(".", 1)[-1].lower()
            nombre_guardado = uuid.uuid4().hex + "." + extension
            archivo.save(os.path.join(app.config["UPLOAD_FOLDER"], nombre_guardado))
            db.session.add(Registro(
                ruta_archivo="uploads/" + nombre_guardado,
                nombre_archivo=archivo.filename,
                avistamiento_id=avistamiento.id,
            ))
        db.session.commit()
        flash("Avistamiento registrado correctamente.", "exito")
        return redirect(url_for("portada"))
    return render_template(
        "avistamiento_register.html",
        regiones=regiones, comunas_por_region=comunas_por_region(), aves=aves,
        errores=errores, datos=datos, mostrar_acceso=mostrar_acceso,
        error_acceso=error_acceso, email_validado=email_validado,
    )


@app.route("/verificar_voluntario", methods=["POST"])
def verificar_voluntario():
    email = request.form.get("email", "").strip().lower()
    if not REGEX_EMAIL.match(email):
        return jsonify(valido=False, mensaje="Ingresa un email válido.")
    voluntario = db.session.query(Voluntario).filter(func.lower(Voluntario.email) == email).first()
    if not voluntario:
        return jsonify(valido=False, mensaje="Este email no está registrado como voluntario.")
    return jsonify(valido=True)


@app.route("/listado")
def listado():
    pagina = request.args.get("pagina", 1, type=int)
    if pagina < 1:
        pagina = 1
    tipo = request.args.get("tipo", "")
    orden = request.args.get("orden", "fecha-desc")
    fecha = request.args.get("fecha", "")
    region = request.args.get("region", "")
    comuna = request.args.get("comuna", "")

    consulta = (
        db.session.query(Avistamiento)
        .join(Voluntario, Avistamiento.voluntario_id == Voluntario.id)
        .join(Ave, Avistamiento.ave_id == Ave.id)
        .join(Comuna, Avistamiento.comuna_id == Comuna.id)
        .join(Region, Comuna.region_id == Region.id)
    )
    if region:
        consulta = consulta.filter(Region.id == region)
    if comuna:
        consulta = consulta.filter(Comuna.id == comuna)
    if fecha:
        consulta = consulta.filter(func.date(Avistamiento.fecha_hora) == fecha)
    if tipo in CATEGORIAS_AVES:
        condiciones = [Ave.nombre.ilike(f"%{clave}%") for clave in CATEGORIAS_AVES[tipo]]
        consulta = consulta.filter(or_(*condiciones))
    if orden == "lugar-asc":
        consulta = consulta.order_by(Avistamiento.lugar.asc())
    elif orden == "fecha-asc":
        consulta = consulta.order_by(Avistamiento.fecha_hora.asc())
    else:
        consulta = consulta.order_by(Avistamiento.fecha_hora.desc())

    total = consulta.count()
    total_paginas = max(1, (total + AVISTAMIENTOS_POR_PAGINA - 1) // AVISTAMIENTOS_POR_PAGINA)
    pagina = min(pagina, total_paginas)
    avistamientos = (
        consulta
        .offset((pagina - 1) * AVISTAMIENTOS_POR_PAGINA)
        .limit(AVISTAMIENTOS_POR_PAGINA)
        .all()
    )

    filtros = {
        "tipo": tipo, "orden": orden, "fecha": fecha,
        "region": region, "comuna": comuna,
    }
    return render_template(
        "listado.html",
        avistamientos=avistamientos, pagina=pagina, total_paginas=total_paginas,
        regiones=db.session.query(Region).order_by(Region.nombre).all(),
        comunas_por_region=comunas_por_region(), filtros=filtros,
    )


@app.route("/detalle/<int:avistamiento_id>")
def detalle(avistamiento_id):
    avistamiento = db.session.get(Avistamiento, avistamiento_id)
    if not avistamiento:
        abort(404)
    return render_template("detalle.html", avistamiento=avistamiento)


@app.route("/estadisticas")
def estadisticas():
    return render_template("metricas.html")


if __name__ == "__main__":
    app.run(debug=True)