document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.querySelector(".detalle-container");
    if (!contenedor) return;

    const avistamientoId = contenedor.dataset.avistamientoId;
    const form = document.getElementById("form-comentario");
    const divErrores = document.getElementById("comentario-errores");
    const listaComentarios = document.getElementById("lista-comentarios");

    function cargarComentarios() {
        fetch(`/api/avistamiento/${avistamientoId}/comentarios`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.comentarios || data.comentarios.length === 0) {
                    listaComentarios.innerHTML = "<p><em>No hay comentarios registrados para este avistamiento.</em></p>";
                    return;
                }

                listaComentarios.innerHTML = data.comentarios.map((c) => `
                    <div style="border-bottom: 1px solid #e0e0e0; padding: 10px 0;">
                        <strong>${escapeHTML(c.nombre)}</strong> 
                        <small style="color: #666; margin-left: 8px;">(${escapeHTML(c.fecha)})</small>
                        <p style="margin: 5px 0 0 0;">${escapeHTML(c.texto)}</p>
                    </div>
                `).join("");
            })
            .catch(() => {
                listaComentarios.innerHTML = "<p style='color: red;'>Error al cargar los comentarios.</p>";
            });
    }

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        ocultarErrores();

        const nombre = document.getElementById("nombre").value.trim();
        const texto = document.getElementById("texto").value.trim();

        const errores = [];
        if (!nombre || nombre.length < 3 || nombre.length > 50) {
            errores.push("El nombre de comentarista es obligatorio y debe tener entre 3 y 50 caracteres.");
        }
        if (!texto || texto.length < 5) {
            errores.push("El texto del comentario es obligatorio y debe tener al menos 5 caracteres.");
        }

        if (errores.length > 0) {
            mostrarErrores(errores);
            return;
        }

        fetch(`/api/avistamiento/${avistamientoId}/comentarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nombre: nombre, texto: texto }),
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.errores ? data.errores.join("<br>") : "Ocurrió un error al guardar el comentario.");
                }
                return data;
            })
            .then(() => {
                form.reset();
                cargarComentarios(); 
            })
            .catch((err) => {
                mostrarErrores([err.message]);
            });
    });

    function mostrarErrores(lista) {
        divErrores.innerHTML = lista.join("<br>");
        divErrores.style.display = "block";
    }

    function ocultarErrores() {
        divErrores.style.display = "none";
        divErrores.innerHTML = "";
    }

    function escapeHTML(str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[m]));
    }
    cargarComentarios();
});
