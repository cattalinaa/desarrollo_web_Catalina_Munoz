# CC5002 - Tarea 2: Avistamiento de Aves en Chile - Catalina Muñoz

## Descripción

Aplicación web desarrollada con Python y el framework Flask, junto a una base de datos MySQL,implementando las funcionalidades de portada, registro de voluntarios,registro de avistamiento, listado de avistamientos . Las estadísticas (indicadores y métricas) quedan pendientes para la siguiente tarea, según lo indicado en el enunciado.

La interfaz reutiliza las vistas y validaciones JavaScript de la Tarea 1, adaptadas para enviar los datos a URLs atendidas por Flask, donde los datos se validan nuevamente en el lado del servidor antes de insertarlos en la base de datos.

## Vistas principales

- `GET /` (`index.html`): portada con mensaje de bienvenida, menú principal y listado de los últimos 2 avistamientos agregados a la base de datos.
- `GET/POST /voluntario` (`volunteer_register.html`): registro de voluntarios.
- `GET/POST /avistamiento` (`avistamiento_register.html`): registro de avistamientos, con acceso restringido a voluntarios registrados (validación previa del email contra la base de datos).
- `GET /listado` (`listado.html`): listado paginado de avistamientos con filtros y ordenamiento; cada fila es clicable y lleva al detalle.
- `GET /detalle/<id>` (`detalle.html`): información ordenada del avistamiento, con fotos y videos asociados.
- `GET /estadisticas` (`metricas.html`): vista accesible, pero sin datos por ahora (pendiente para la siguiente entrega).

## Decisiones de diseño e implementación

### Campo "Tipo de ave" en el formulario de avistamiento

El campo "Tipo de ave" se mantiene en el formulario como orientativo, tal como estaba en la Tarea 1, pero no aplica ninguna clasificación ni condición sobre los tipos de ave: la base de datos entrega un catálogo plano de aves (tabla `ave`) sin categorías, y el avistamiento se asocia a la ave por su nombre, buscado en ese catálogo. Al seleccionar un tipo se muestran ejemplos de aves pertenecientes a esa categoría, solo como ayuda.

### Portada: últimos avistamientos por orden de inserción

La vista de inicio muestra los dos últimos avistamientos agregados a la base de datos (por orden de inserción, `id DESC`), independiente de si la fecha y hora del avistamiento en sí es más antigua que la de otros registros existentes. Esta es la interpretación dada a "los últimos 2 avistamientos agregados en la base de datos" especificada en el enunciado.

### Vista de Estadísticas/Métricas

La vista de Estadísticas sigue siendo accesible desde el menú, pero por ahora no muestra datos: se dejó como placeholder, ya que las funcionalidades de indicadores y métricas quedaron pendientes para la siguiente tarea según el enunciado.

### Corrección de la Tarea 1 incorporada

Se incorporó la corrección recibida en la Tarea 1: el listado de avistamientos se despliega en una tabla HTML (`table`/`th`/`td`) paginada en lugar de tarjetas. Las filas son clicables y llevan al detalle del avistamiento.

### Modelo de datos adaptado

El enunciado propone un modelo de datos que se puede adaptar a las decisiones de diseño. Se agregó la columna `comuna_id` (FK a `comuna`) a la tabla `avistamiento`: de este modo, la región y comuna mostradas para cada avistamiento son las ingresadas en el formulario "Informar Avistamiento", y no las de la comuna de registro del voluntario.

### Asociación del voluntario al avistamiento

El avistamiento queda asociado al voluntario por su email, validado contra la base de datos: la página exige el email antes de mostrar el formulario (endpoint `POST /verificar_voluntario` que responde JSON), y el servidor vuelve a validar el email al recibir el POST del formulario, por lo que nunca se confía en el cliente.

### Validaciones en el cliente y en el servidor

Se conservan todas las validaciones JavaScript de la Tarea 1 (nombre en una sola palabra, email, teléfono con formato `+569XXXXXXXX`, rango de fechas, hora no futura, cantidad y formato de archivos), y además cada URL de envío valida nuevamente todos los datos en el lado del servidor con las mismas reglas:

- `validaciones.py`: validación de voluntario y de avistamiento.
- Los errores del servidor se muestran en los mismos `span` de mensajes del formulario, que se re-renderiza conservando los datos ingresados.

### Selección de ave con autocompletado

El nombre del ave se elige mediante un campo con lista desplegable que se va filtrando a medida que se escriben letras (insensible a mayúsculas y tildes), cargada desde la tabla `ave` (585 aves). El servidor verifica que el nombre exista en el catálogo.

### Regiones y comunas desde la base de datos

Las regiones (16) y comunas (345) se cargan desde las tablas `region` y `comuna` (pobladas con `region-comuna.sql`). La comuna se carga de manera dependiente de la región seleccionada, con las mismas opciones usadas en los formularios y en los filtros del listado.

### Archivos adjuntos

Las fotos y videos (mínimo 1, máximo 5; formatos JPG, PNG, WEBP, MP4 o WEBM) se guardan en `app/static/uploads/` con un nombre generado por UUID (nunca el nombre original del usuario, evitando problemas de seguridad) y su ruta y nombre original se registran en la tabla `registro`, permitiendo varias filas por avistamiento (relación 1 a N).

### Seguridad

- Todas las consultas usan SQLAlchemy parametrizado (sin concatenación de SQL), protegiendo contra inyección SQL.
- Jinja2 con autoescape activado por defecto (protección contra XSS).
- Las entradas de formularios y los parámetros de URL se validan por largo y formato en el servidor.
- Límite de tamaño de subida (`MAX_CONTENT_LENGTH` = 20 MB).

### Organización de archivos

- `app.py`: configuración de la aplicación y rutas de Flask.
- `db.py`: instancia de SQLAlchemy.
- `models.py`: modelos de las seis entidades del diagrama E-R (`region`, `comuna`, `voluntario`, `ave`, `avistamiento`, `registro`).
- `validaciones.py`: validaciones del lado del servidor.
- `templates/`: plantillas Jinja2 (`base.html`, `index.html`, `volunteer_register.html`, `avistamiento_register.html`, `listado.html`, `detalle.html`, `metricas.html`).
- `static/css/style.css`: estilos compartidos.
- `static/js/`: validaciones JavaScript adaptadas, carga dependiente de comunas, autocompletado de aves y filtros del listado.
- `static/uploads/`: archivos adjuntos subidos.
