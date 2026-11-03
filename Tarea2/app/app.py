import os
import uuid
from datetime import datetime

from flask import Flask, abort, flash, jsonify, redirect, render_template, request, url_for
from sqlalchemy import func, or_

from db import db
from models import Ave, Avistamiento, Comuna, Region, Registro, Voluntario,Comentario
from validaciones import REGEX_EMAIL, validar_avistamiento, validar_voluntario,validar_comentario

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(app.static_folder, "uploads")
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
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


@app.route("/metricas")
@app.route("/estadisticas")
def estadisticas():
    return render_template("metricas.html")


@app.route("/api/estadisticas")
def api_estadisticas():
    por_dia_query = (
        db.session.query(
            func.date(Avistamiento.fecha_hora).label("fecha"),
            func.count(Avistamiento.id).label("total")
        )
        .group_by(func.date(Avistamiento.fecha_hora))
        .order_by(func.date(Avistamiento.fecha_hora).asc())
        .all()
    )
    por_dia = [{"fecha": str(row.fecha), "total": row.total} for row in por_dia_query]

    por_ave_query = (
        db.session.query(
            Ave.nombre.label("ave"),
            func.count(Avistamiento.id).label("total")
        )
        .join(Avistamiento, Ave.id == Avistamiento.ave_id)
        .group_by(Ave.id, Ave.nombre)
        .all()
    )
    por_ave = [{"ave": row.ave, "total": row.total} for row in por_ave_query]

    por_comuna_query = (
        db.session.query(
            Comuna.nombre.label("comuna"),
            func.count(Voluntario.id).label("total")
        )
        .join(Voluntario, Comuna.id == Voluntario.comuna_id)
        .group_by(Comuna.id, Comuna.nombre)
        .having(func.count(Voluntario.id) > 0)
        .all()
    )
    por_comuna = [{"comuna": row.comuna, "total": row.total} for row in por_comuna_query]

    return jsonify(por_dia=por_dia, por_ave=por_ave, por_comuna=por_comuna)


@app.route("/api/avistamiento/<int:avistamiento_id>/comentarios", methods=["GET"])
def api_obtener_comentarios(avistamiento_id):
    comentarios = (
        db.session.query(Comentario)
        .filter(Comentario.avistamiento_id == avistamiento_id)
        .order_by(Comentario.fecha.desc())
        .all()
    )
    datos = [
        {
            "id": c.id,
            "nombre": c.nombre,
            "texto": c.texto,
            "fecha": c.fecha.strftime("%d-%m-%Y %H:%M"),
        }
        for c in comentarios
    ]
    return jsonify(comentarios=datos)


@app.route("/api/avistamiento/<int:avistamiento_id>/comentarios", methods=["POST"])
def api_agregar_comentario(avistamiento_id):
    payload = request.get_json() or {}
    errores, datos = validar_comentario(payload)

    if errores:
        return jsonify(success=False, errores=list(errores.values())), 400

    comentario = Comentario(
        nombre=datos["nombre"],
        texto=datos["texto"],
        fecha=datetime.now(),
        avistamiento_id=avistamiento_id,
    )
    db.session.add(comentario)
    db.session.commit()

    return jsonify(success=True, mensaje="Comentario agregado correctamente."), 201

if __name__ == "__main__":
    app.run(debug=True)