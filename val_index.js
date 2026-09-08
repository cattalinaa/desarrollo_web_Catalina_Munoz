const categoriasAves = {
    urbanas_jardin: "Aves Urbanas y de Jardín",
    pajaros_canto: "Pájaros de Canto y Silvestres",
    rapaces_carroneras: "Rapaces y Carroñeras",
    acuaticas_nadadoras: "Aves Acuáticas y Nadadoras",
    zancudas_orilla: "Aves Zancudas y de Orilla",
    marinas_pelagicas: "Aves Marinas y Pelágicas",
    carpinteros_trepadores: "Carpinteros y Trepadores",
    perdices_terrestres: "Palomas Silvestres y Perdices"
};

const avistamientoEjemplo = {
    id: "ejemplo",
    tipoAve: "urbanas_jardin",
    nombreAve: "Zorzal",
    lugar: "Parque O'Higgins",
    fecha: "2026-08-20",
    hora: "10:30"
};

function obtenerEvidenciaTemporal(id) {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open("avistamientosDB", 1);
        solicitud.onupgradeneeded = () => {
            solicitud.result.createObjectStore("evidencias");
        };
        solicitud.onsuccess = () => {
            const base = solicitud.result;
            const consulta = base.transaction("evidencias", "readonly").objectStore("evidencias").get(id);
            consulta.onsuccess = () => {
                base.close();
                resolve(consulta.result);
            };
            consulta.onerror = () => {
                base.close();
                reject(consulta.error);
            };
        };
        solicitud.onerror = () => reject(solicitud.error);
    });
}

const regionesYComunas = {
    "Región de Valparaíso": ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana"],
    "Región Metropolitana": ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Cerrillos"],
    "Región del Biobío": ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante"]
};

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedor-actividades");
    const filtroTipo = document.getElementById("filtro-tipo");
    const filtroOrden = document.getElementById("filtro-orden");
    const filtroFecha = document.getElementById("filtro-fecha");
    const filtroRegion = document.getElementById("filtro-region");
    const filtroComuna = document.getElementById("filtro-comuna");
    const avisoFiltroFecha = document.getElementById("aviso-filtro-fecha");
    const formFiltros = document.getElementById("form-filtros");
    const paginacion = document.getElementById("paginacion");
    if (!contenedor) return;

    let guardados = [];
    try {
        guardados = JSON.parse(localStorage.getItem("avistamientos") || "[]");
    } catch (error) {
        localStorage.removeItem("avistamientos");
    }
    const avistamientos = [avistamientoEjemplo, ...guardados];

    const hoy = new Date().toISOString().split("T")[0];
    filtroFecha.max = hoy;
    avisoFiltroFecha.textContent = `Solo puedes elegir hasta ${hoy}.`;
    Object.keys(regionesYComunas).forEach((region) => {
        const opcion = document.createElement("option");
        opcion.value = region;
        opcion.textContent = region;
        filtroRegion.appendChild(opcion);
    });

    filtroRegion.addEventListener("change", () => {
        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Todas las comunas";
        filtroComuna.replaceChildren(opcionInicial);
        const comunas = regionesYComunas[filtroRegion.value] || [];
        comunas.forEach((comuna) => {
            const opcion = document.createElement("option");
            opcion.value = comuna;
            opcion.textContent = comuna;
            filtroComuna.appendChild(opcion);
        });
        filtroComuna.disabled = comunas.length === 0;
    });

    let paginaActual = 1;
    const avistamientosPorPagina = 6;

    function renderizarListado() {
        const tipoSeleccionado = filtroTipo.value;
        const ordenSeleccionado = filtroOrden.value;
        const fechaSeleccionada = filtroFecha.value;
        const regionSeleccionada = filtroRegion.value;
        const comunaSeleccionada = filtroComuna.value;
        const filtrados = avistamientos.filter((avistamiento) => {
            return (!tipoSeleccionado || avistamiento.tipoAve === tipoSeleccionado)
                && (!fechaSeleccionada || avistamiento.fecha === fechaSeleccionada)
                && (!regionSeleccionada || avistamiento.region === regionSeleccionada)
                && (!comunaSeleccionada || avistamiento.comuna === comunaSeleccionada);
        });

        filtrados.sort((a, b) => {
            if (ordenSeleccionado === "lugar-asc") {
                return a.lugar.localeCompare(b.lugar);
            }
            const fechaA = new Date(`${a.fecha}T${a.hora || "00:00"}`);
            const fechaB = new Date(`${b.fecha}T${b.hora || "00:00"}`);
            const diferencia = fechaA - fechaB;
            return ordenSeleccionado === "fecha-asc" ? diferencia : -diferencia;
        });

        const totalPaginas = Math.max(1, Math.ceil(filtrados.length / avistamientosPorPagina));
        paginaActual = Math.min(paginaActual, totalPaginas);
        const inicio = (paginaActual - 1) * avistamientosPorPagina;
        const pagina = filtrados.slice(inicio, inicio + avistamientosPorPagina);
        contenedor.replaceChildren();

        pagina.forEach((avistamiento) => {
            const tarjeta = document.createElement("article");
            tarjeta.className = "tarjeta-actividad";
            const contenido = document.createElement("div");
            contenido.className = "tarjeta-contenido";
            const titulo = document.createElement("h3");
            titulo.textContent = avistamiento.nombreAve || "Ave sin nombre";
            contenido.appendChild(titulo);

            const datos = [
                ["Tipo", categoriasAves[avistamiento.tipoAve] || avistamiento.tipoAve],
                ["Región", avistamiento.region || "No informada"],
                ["Comuna", avistamiento.comuna || "No informada"],
                ["Lugar", avistamiento.lugar || "No informado"],
                ["Fecha", `${avistamiento.fecha} ${avistamiento.hora || ""}`]
            ];
            datos.forEach(([etiqueta, valor]) => {
                const parrafo = document.createElement("p");
                const negrita = document.createElement("strong");
                negrita.textContent = `${etiqueta}: `;
                parrafo.appendChild(negrita);
                parrafo.appendChild(document.createTextNode(valor));
                contenido.appendChild(parrafo);
            });

            const botonAdjuntos = document.createElement("button");
            botonAdjuntos.type = "button";
            botonAdjuntos.className = "ver-adjuntos";
            botonAdjuntos.setAttribute("aria-expanded", "false");
            botonAdjuntos.textContent = "Ver imágenes/videos adjuntos";
            contenido.appendChild(botonAdjuntos);

            const contenedorAdjuntos = document.createElement("div");
            contenedorAdjuntos.className = "adjuntos-tarjeta hidden";
            contenido.appendChild(contenedorAdjuntos);
            tarjeta.appendChild(contenido);
            botonAdjuntos.addEventListener("click", async () => {
                const estaVisible = !contenedorAdjuntos.classList.contains("hidden");
                contenedorAdjuntos.classList.toggle("hidden", estaVisible);
                botonAdjuntos.setAttribute("aria-expanded", String(!estaVisible));
                botonAdjuntos.textContent = estaVisible
                    ? "Ver imágenes/videos adjuntos"
                    : "Ocultar imágenes/videos adjuntos";

                if (!estaVisible && contenedorAdjuntos.childElementCount === 0) {
                    const evidencias = Array.isArray(avistamiento.evidencia) ? avistamiento.evidencia : [];
                    const evidenciasConDatos = evidencias.filter((evidencia) => evidencia && (evidencia.datos || evidencia.id));
                    if (evidenciasConDatos.length === 0) {
                        contenedorAdjuntos.textContent = "Este registro no contiene archivos disponibles para mostrar.";
                        return;
                    }
                    for (const evidencia of evidenciasConDatos) {
                        let archivo = evidencia;
                        if (!archivo.datos && archivo.id) {
                            archivo = await obtenerEvidenciaTemporal(archivo.id);
                            if (!archivo) continue;
                            archivo.datos = URL.createObjectURL(archivo.blob);
                        }
                        const elemento = archivo.tipo.startsWith("video/")
                            ? document.createElement("video")
                            : document.createElement("img");
                        elemento.src = archivo.datos;
                        elemento.alt = archivo.nombre || "Evidencia del avistamiento";
                        if (elemento.tagName === "VIDEO") elemento.controls = true;
                        contenedorAdjuntos.appendChild(elemento);
                    }
                }
            });
            contenedor.appendChild(tarjeta);
        });

        paginacion.replaceChildren();
        for (let numero = 1; numero <= totalPaginas; numero += 1) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.textContent = numero;
            boton.className = numero === paginaActual ? "pagina-activa" : "";
            boton.addEventListener("click", () => {
                paginaActual = numero;
                renderizarListado();
            });
            paginacion.appendChild(boton);
        }
    }

    formFiltros.addEventListener("submit", (event) => {
        event.preventDefault();
        if (filtroFecha.value > hoy) {
            avisoFiltroFecha.textContent = "La fecha no puede ser futura.";
            return;
        }
        paginaActual = 1;
        renderizarListado();
    });

    renderizarListado();
});
