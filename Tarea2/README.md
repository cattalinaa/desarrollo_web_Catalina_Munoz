# CC5002 - Tarea 3: Sistema de Avistamiento de Aves en Chile - Catalina Muñoz

## Descripción

Aplicación web completa (Full Stack) para registrar voluntarios, publicar avistamientos de aves en Chile con archivos multimedia, consultar estadísticas interactivas y realizar comentarios en tiempo real. El proyecto está construido con un backend en **Python (Flask)** y **MySQL/SQLAlchemy**, e interactúa con el frontend mediante **HTML5, CSS3, JavaScript (Vanilla JS)** y **APIs REST** con peticiones asíncronas (`fetch`).

## Vistas principales

- `index.html`: portada del portal con bienvenida, accesos principales y tabla dinámicamente renderizada con los 2 últimos avistamientos registrados.
- `volunteer_register.html`: formulario para la incorporación de nuevos voluntarios al sistema.
- `avistamiento_register.html`: formulario para el reporte de avistamientos, restringido exclusivamente a voluntarios validados por su correo electrónico.
- `listado.html`: visualización completa del catálogo de avistamientos con paginación dinámica y filtros de búsqueda (región, comuna, fecha, tipo de ave y ordenamiento).
- `detalle.html`: vista detallada de un avistamiento particular, incluyendo galería multimedia (imágenes/videos) y el sistema interactivo de comentarios.
- `metricas.html`: panel interactivo con visualización de datos estadísticos mediante gráficos generados dinámicamente.

---

## Decisiones de diseño e implementación

### 1. Persistencia e Integración de la Tabla `comentario`

De acuerdo con las especificaciones de la Tarea 3, se incorporó la tabla `comentario` a la base de datos MySQL relacional mediante el archivo `tabla-comentario.sql`. 

Para asegurar una ejecución inmediata sin requerir la manipulación manual de scripts por parte del evaluador, se configuró el ORM en `app.py` mediante el contexto de la aplicación:

```python
with app.app_context():
    db.create_all()
```

Esto garantiza que las tablas (incluyendo `comentario`) se creen automáticamente en MySQL si no existen al momento de levantar el servidor Flask.

### 2. Sistema de Comentarios Asíncrono (`fetch` API)

En la vista de detalle de cada avistamiento (`detalle.html`), los comentarios no requieren la recarga completa de la página:

- **Carga de comentarios (`GET`):** Al cargar la vista, JavaScript solicita la lista de comentarios mediante `fetch('/api/avistamiento/<id>/comentarios')` y construye el marcado HTML dinámicamente.
- **Inserción de comentarios (`POST`):** Al enviar el formulario, `detalle.js` intercepta el evento `submit`, envía la carga en formato JSON a la API y, ante una respuesta exitosa (`201 Created`), limpia los campos y actualiza la lista de comentarios.

### 3. Validación de Formularios en Dos Capas (Cliente y Servidor)

El formulario de comentarios cumple estrictamente con las reglas del enunciado:

- **Nombre del comentarista:** Caja de texto obligatoria, entre 3 y 50 caracteres (`minlength="3"`, `maxlength="50"`).
- **Texto del comentario:** Área de texto (`<textarea>`) configurada visualmente a 3 filas y 40 columnas (`rows="3" cols="40"`), obligatoria y con al menos 5 caracteres no vacíos (`minlength="5"`).

**Estrategia de validación:**
1. **Lado del Cliente:** Se utilizó el atributo `novalidate` en la etiqueta `<form>` para desactivar los globos emergentes nativos en inglés del navegador. La validación se gestiona con JavaScript en español antes del envío, impidiendo peticiones innecesarias al servidor si los campos están incompletos o solo contienen espacios en blanco.
2. **Lado del Servidor:** En `validaciones.py` (`validar_comentario`), el backend sanitiza las cadenas con `.strip()` y revalida la longitud de los campos. Si no se cumplen los requisitos, la API retorna un código HTTP `400 Bad Request` junto con el detalle de errores en JSON, manteniendo el formulario visible y los datos ingresados para corregirlos.

### 4. Manejo de Imágenes y Archivos Multimedia

Para resolver la visualización recortada de imágenes en la galería de `detalle.html`, se ajustaron las propiedades CSS utilizando `object-fit: contain` en combinación con dimensiones máximas dinámicas (`max-width: 100%`, `max-height: 450px`). Esto garantiza que las fotos verticales y horizontales se mantengan íntegras y escaladas proporcionalmente.

Además, los archivos subidos durante el registro se guardan con identificadores únicos (`uuid4`) dentro del directorio `static/uploads/`, el cual se crea automáticamente en `app.py` si no existe al arrancar la aplicación.

### 5. Generación de Gráficos y Métricas (Librería Externa)

Para la generación de gráficos en `metricas.html`, se utilizó la biblioteca de código abierto **Chart.js (v4.x)** consumida a través de su CDN oficial (`https://cdn.jsdelivr.net/npm/chart.js`).

- **Derechos de uso:** Chart.js está liberada bajo la **Licencia MIT**, lo que permite su libre uso e integración en este proyecto académico.
- **Funcionamiento:** `metricas.js` realiza una llamada `fetch` al endpoint `/api/estadisticas` en Flask, obteniendo arreglos JSON para renderizar tres gráficos:
  1. Avistamientos registrados por fecha.
  2. Distribución de avistamientos por especie de ave.
  3. Concentración de voluntarios por comuna.

### 6. Seguridad, Sanitización y Estándares W3C

- **Inyección SQL:** Prevenida mediante el uso exclusivo de **SQLAlchemy ORM** (`db.session.query`), delegando al driver la parametrización de todas las consultas SQL.
- **Prevención de XSS:** Se implementó una función de escape en JavaScript (`escapeHTML`) que convierte caracteres especiales (`<`, `>`, `&`, `"`, `'`) a entidades HTML seguras antes de insertar comentarios al DOM dinámicamente. En el servidor, **Jinja2** aplica automapping y sanitización automática en las plantillas.
- **Parámetros en la URL:** Las rutas utilizan conversores de tipos estrictos (ej. `<int:avistamiento_id>`). En caso de identificadores inexistentes, Flask retorna un código HTTP `404 Not Found` (`abort(404)`).
- **Validador W3C:** La estructura HTML5 y las hojas de estilos CSS3 fueron validadas según las especificaciones de W3C, vinculando correctamente las etiquetas `<label for="...">` con sus inputs correspondientes.

---

## Organización de archivos

- `app.py`: punto de entrada de la aplicación, configuración del servidor Flask, conexión a MySQL y definición de rutas de vistas y endpoints API REST.
- `db.py`: inicialización de la instancia global de SQLAlchemy.
- `models.py`: definición de modelos relacionales (Region, Comuna, Voluntario, Ave, Avistamiento, Registro y Comentario).
- `validaciones.py`: funciones auxiliares para la validación estricta en el servidor de voluntarios, avistamientos y comentarios.
- `tabla-comentario.sql`: script de creación de la tabla `comentario`.
- `static/css/estilos.css`: hoja de estilos principal compartida por la aplicación.
- `static/js/detalle.js`: lógica del frontend para la carga y envío asíncrono de comentarios mediante `fetch`.
- `static/js/metricas.js`: procesamiento de datos de la API y renderizado de gráficos interactivos con Chart.js.
- `templates/`: plantillas HTML (Jinja2) organizadas de forma modular heredando de `base.html`.

---

## Ejecución

### 1. Entorno Virtual e Instalación de Dependencias

```bash
# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar librerías requeridas
pip install flask flask-sqlalchemy pymysql
```

### 2. Configurar Base de Datos MySQL

1. Asegurarse de tener un servidor MySQL corriendo localmente en el puerto `3306`.
2. Crear la base de datos `tarea2` con soporte completo de caracteres UTF-8:
   ```sql
   CREATE DATABASE tarea2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Importar las tablas base del proyecto (`region`, `comuna`, `voluntario`, `ave`, `avistamiento`, `registro`).

> **Credenciales por defecto en `app.py`:**
> `mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4`

### 3. Iniciar la Aplicación

Ejecutar el servidor Flask:

```bash
python app.py
```

La aplicación creará automáticamente la tabla `comentario` y la carpeta `static/uploads/` si no existen. Acceder desde cualquier navegador a:

```text
http://127.0.0.1:5000/
```
