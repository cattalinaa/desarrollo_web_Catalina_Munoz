from db import db


class Region(db.Model):
    __tablename__ = "region"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    comunas = db.relationship("Comuna", backref="region", lazy=True)


class Comuna(db.Model):
    __tablename__ = "comuna"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    region_id = db.Column(db.Integer, db.ForeignKey("region.id"), nullable=False)
    voluntarios = db.relationship("Voluntario", backref="comuna", lazy=True)


class Voluntario(db.Model):
    __tablename__ = "voluntario"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(80), nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False)
    comuna_id = db.Column(db.Integer, db.ForeignKey("comuna.id"), nullable=False)
    avistamientos = db.relationship("Avistamiento", backref="voluntario", lazy=True)


class Ave(db.Model):
    __tablename__ = "ave"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(80), nullable=False)
    avistamientos = db.relationship("Avistamiento", backref="ave", lazy=True)


class Avistamiento(db.Model):
    __tablename__ = "avistamiento"
    id = db.Column(db.Integer, primary_key=True)
    voluntario_id = db.Column(db.Integer, db.ForeignKey("voluntario.id"), nullable=False)
    ave_id = db.Column(db.Integer, db.ForeignKey("ave.id"), nullable=False)
    comuna_id = db.Column(db.Integer, db.ForeignKey("comuna.id"), nullable=False)
    fecha_hora = db.Column(db.DateTime, nullable=False)
    lugar = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    comuna = db.relationship("Comuna", backref="avistamientos", lazy=True)
    registros = db.relationship("Registro", backref="avistamiento", lazy=True)


class Registro(db.Model):
    __tablename__ = "registro"
    id = db.Column(db.Integer, primary_key=True)
    ruta_archivo = db.Column(db.String(300), nullable=False)
    nombre_archivo = db.Column(db.String(300), nullable=False)
    avistamiento_id = db.Column(db.Integer, db.ForeignKey("avistamiento.id"), nullable=False)