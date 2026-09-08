# CC5002 - Tarea 1: Avistamiento de Aves en Chile - Catalina Muñoz

## Descripción

Prototipo de un sistema web para registrar voluntarios y gestionar avistamientos de aves en Chile. El proyecto está construido únicamente con HTML5, CSS3 y JavaScript, sin servidor ni base de datos remota, de acuerdo con las condiciones de la tarea.

## Vistas principales

- `index.html`: consulta listado de avistamientos mediante tarjetas, filtros, ordenamiento y paginación.
- `volunteer_register.html`: registro de voluntarios.
- `avistamiento_register.html`: registro de avistamientos, disponible para emails de voluntarios registrados.
- `métricas.html`: gráficos de voluntarios y avistamientos por región, comuna y tipo de ave.
- `detalle_actividad`: vista auxiliar de detalle de un avistamiento.

## Decisiones de diseño e implementación

### Separación de datos personales

El nombre completo se separó en tres campos: nombre, apellido paterno y apellido materno. Esto permite validar cada segmento de manera independiente y evita que se ingrese un párrafo o varios datos dentro de un único campo.

Cada parte del nombre:

- Es obligatoria.
- No puede estar vacía ni contener solo espacios.
- Debe contener una sola palabra.
- Acepta letras, guion y apóstrofe.

### Validaciones en JavaScript

Las validaciones no dependen únicamente del atributo HTML `required`. Cada formulario tiene validaciones JavaScript propias para revisar campos vacíos, formatos de email, teléfono, fechas, región, comuna, tipo de ave y archivos adjuntos.

Los formularios usan `event.preventDefault()` para evitar que el navegador recargue la página o envíe un formulario vacío antes de ejecutar las validaciones.

Los mensajes de error se muestran en elementos `span` mediante la clase CSS `visible`. La clase se agrega cuando el valor es inválido y se remueve cuando el valor se corrige.

### Regiones y comunas

La región se selecciona mediante un menú desplegable y la comuna se carga de manera dependiente: solo aparecen las comunas asociadas a la región seleccionada.

El prototipo incluye actualmente tres regiones y sus comunas:

- Región de Valparaíso.
- Región Metropolitana.
- Región del Biobío.

Esta decisión permite controlar los valores ingresados y generar métricas consistentes. Si se permitiera escribir libremente la región o comuna, habría que normalizar diferencias de tildes, mayúsculas, minúsculas y nombres escritos de distintas formas.

La misma fuente de datos se reutiliza en el registro de voluntarios, el registro de avistamientos, los filtros y las métricas.

### Fechas de avistamiento

La fecha permitida se calcula dinámicamente según la fecha local del computador. Solo se puede seleccionar una fecha entre un mes atrás y el día actual; no se permiten fechas futuras. La hora tampoco puede ser futura cuando el avistamiento corresponde al día actual.

### Tipos de aves

Los tipos de aves se representan mediante identificadores estables, por ejemplo `urbanas_jardin` o `rapaces_carroneras`. Esto permite filtrar y agrupar los datos sin depender de variaciones de escritura en las etiquetas visibles.

Al seleccionar un tipo, se muestran ejemplos de aves pertenecientes a esa categoría.

### Construcción dinámica del HTML

Para crear tarjetas, opciones de filtros, botones, imágenes y videos se utilizan `document.createElement()`, `appendChild()` y `replaceChildren()`. Esto permite controlar explícitamente la estructura creada y evita construir bloques dinámicos completos mediante concatenación de HTML.

### Organización de archivos

Las vistas se separaron en archivos HTML independientes para evitar concentrar todo el sistema en un solo documento extenso y difícil de mantener. La lógica también se dividió por responsabilidad:

- `validaciones_voluntario.js`: validación y registro de voluntarios.
- `validaciones_registrado.js`: autorización y validación de avistamientos.
- `valReguin_comuna.js`: carga dependiente de regiones y comunas.
- `val_index.js`: consulta, filtros y tarjetas de avistamientos.
- `metricas.js`: cálculo y dibujo de gráficos.
- `detalle.js`: carga de información auxiliar de detalle, correspondiente a los archivos adjuntos.
- `style.css`: estilos compartidos por las vistas.

### Almacenamiento local

Como la tarea no requiere servidor, los datos se almacenan localmente en el navegador:

- `localStorage`: voluntarios, emails autorizados y datos generales de avistamientos.
- `IndexedDB`: fotos y videos adjuntos, evitando el límite reducido de `localStorage`.

Los datos no se suben a internet ni se comparten automáticamente con otros usuarios.

### Acceso a los avistamientos

Antes de publicar un avistamiento se solicita el email usado durante el registro de voluntario. Solo los emails guardados en el almacenamiento local pueden acceder al formulario de publicación. Esta decisión fue dado el requisito explícito de que solo los "voluntarios registrados" pueden registrar avistamientos.

### Métricas

La vista de métricas se actualiza al seleccionar una región y muestra:

- Voluntarios registrados por región o por comuna de la región seleccionada.
- Avistamientos agrupados por tipo de ave.
- Avistamientos agrupados por región.

Los gráficos conservan todas sus categorías, incluso cuando una categoría tiene valor cero, para facilitar la comparación.

## Ejecución

Como no se necesita servidor web. Se puede abrir `index.html` directamente en el navegador. Para probar el flujo completo:

1. Registrar un voluntario.
2. Validar su email en `avistamiento_register.html`.
3. Registrar un avistamiento con al menos una foto o video.
4. Consultar el registro en `index.html` y revisar las métricas.
