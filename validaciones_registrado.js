document.addEventListener("DOMContentLoaded", () => {
    const acceso = document.getElementById("acceso-voluntario");
    const formAcceso = document.getElementById("form-acceso-voluntario");
    const formAvistamiento = document.getElementById("form-actividad");
    const avisoAcceso = document.getElementById("aviso-acceso");
    const fechaInput = document.getElementById("fecha_avistamiento");
    const horaInput = document.getElementById("hora_avistamiento");
    const avisoFecha = document.getElementById("aviso-fecha");
    const avisoHora = document.getElementById("aviso-hora");
    const modal = document.getElementById("modal-confirmacion");
    let emailVoluntarioAutorizado = "";
    const tipoAve = document.getElementById("tipo_ave");
    const descripcionTipoAve = document.getElementById("descripcion-tipo-ave");

    function mostrarError(idAviso, mensaje) {
        const aviso = document.getElementById(idAviso);
        aviso.textContent = mensaje;
        aviso.classList.toggle("visible", Boolean(mensaje));
    }

    const categoriasAves = {
        urbanas_jardin: {
            
            description: "Ejemplos: zorzal, chincol, gorrión, palomas, tórtolas y tordo."
        },
        pajaros_canto: {
            label: "Pájaros de Canto y Silvestres",
            description: "Ejemplos: chucao, loica, tijeral, diuca, turca y rayadito."
        },
        rapaces_carroneras: {
            label: "Rapaces y Carroñeras",
            description: "Ejemplos: cóndor, águila, peuco, cernícalo, jote y lechuza."
        },
        acuaticas_nadadoras: {
            label: "Aves Acuáticas y Nadadoras",
            description: "Ejemplos: patos, cisnes, taguas y pimpollos."
        },
        zancudas_orilla: {
            label: "Aves Zancudas y de Orilla",
            description: "Ejemplos: garzas, flamencos, queltehue, zarapito y pilpilén."
        },
        marinas_pelagicas: {
            label: "Aves Marinas y Pelágicas",
            description: "Ejemplos: pingüinos, albatros, fardelas, cormoranes y gaviotas."
        },
        carpinteros_trepadores: {
            label: "Carpinteros y Trepadores",
            description: "Ejemplos: carpintero negro, pitío y comecebo."
        },
        perdices_terrestres: {
            label: "Palomas Silvestres y Perdices",
            description: "Ejemplos: perdiz chilena y tórtolas silvestres."
        }
    };

    if (!formAcceso || !formAvistamiento) return;

    tipoAve.addEventListener("change", () => {
        const categoria = categoriasAves[tipoAve.value];
        descripcionTipoAve.textContent = categoria ? `${categoria.label}: ${categoria.description}` : "";
    });

    const ahora = new Date();
    const formatearFechaLocal = (fecha) => {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return `${año}-${mes}-${dia}`;
    };
    const fechaMaxima = formatearFechaLocal(ahora);
    const fechaMinimaDate = new Date(ahora);
    fechaMinimaDate.setMonth(fechaMinimaDate.getMonth() - 1);
    const fechaMinima = formatearFechaLocal(fechaMinimaDate);
    fechaInput.min = fechaMinima;
    fechaInput.max = fechaMaxima;
    avisoFecha.textContent = `Rango permitido: ${fechaMinima} a ${fechaMaxima}.`;

    formAcceso.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = document.getElementById("email-acceso").value.trim().toLowerCase();
        const emailsRegistrados = JSON.parse(localStorage.getItem("emailsVoluntarios") || "[]");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            const mensaje = email ? "Ingresa un email válido." : "El email no puede quedar vacío.";
            mostrarError("aviso-acceso", mensaje);
            return;
        }
        if (!emailsRegistrados.map((registrado) => registrado.toLowerCase()).includes(email)) {
            mostrarError("aviso-acceso", "Este email no está registrado como voluntario.");
            return;
        }
        mostrarError("aviso-acceso", "");

        acceso.classList.add("hidden");
        formAvistamiento.classList.remove("hidden");
        emailVoluntarioAutorizado = email;
    });

    function validarFechaYHora() {
        const fecha = fechaInput.value;
        const hora = horaInput.value;
        let errorFecha = "";
        let errorHora = "";

        if (!fecha) {
            errorFecha = "La fecha del avistamiento es obligatoria.";
        } else if (fecha < fechaMinima || fecha > fechaMaxima) {
            errorFecha = "La fecha debe estar dentro del último mes y no puede ser futura.";
        }
        if (!hora) {
            errorHora = "La hora del avistamiento es obligatoria.";
        } else if (fecha === fechaMaxima && new Date(`${fecha}T${hora}`) > new Date()) {
            errorHora = "La hora no puede ser futura.";
        }
        avisoFecha.textContent = errorFecha || `Rango permitido: ${fechaMinima} a ${fechaMaxima}.`;
        avisoFecha.classList.toggle("visible", Boolean(errorFecha));
        avisoHora.textContent = errorHora;
        avisoHora.classList.toggle("visible", Boolean(errorHora));
        fechaInput.setCustomValidity(errorFecha);
        horaInput.setCustomValidity(errorHora);
        return !errorFecha && !errorHora;
    }

    fechaInput.addEventListener("input", validarFechaYHora);
    fechaInput.addEventListener("change", validarFechaYHora);
    horaInput.addEventListener("input", validarFechaYHora);
    horaInput.addEventListener("change", validarFechaYHora);

    formAvistamiento.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!validarFechaYHora()) return;

        const archivos = document.getElementById("evidencia").files;
        const nombreAve = document.getElementById("nombre_ave").value.trim();
        const tipoAve = document.getElementById("tipo_ave").value;
        const regionAvistamiento = document.getElementById("region").value;
        const comunaAvistamiento = document.getElementById("comuna").value;
        if (!regionAvistamiento) {
            mostrarError("aviso-region-avistamiento", "Debes seleccionar una región.");
            alert("Debes seleccionar una región.");
            return;
        }
        mostrarError("aviso-region-avistamiento", "");
        if (!comunaAvistamiento) {
            mostrarError("aviso-comuna-avistamiento", "Debes seleccionar una comuna.");
            alert("Debes seleccionar una comuna.");
            return;
        }
        mostrarError("aviso-comuna-avistamiento", "");
        if (!tipoAve) {
            mostrarError("aviso-tipo-ave", "Debes seleccionar el tipo de ave.");
            alert("Debes seleccionar el tipo de ave.");
            return;
        }
        mostrarError("aviso-tipo-ave", "");
        if (!nombreAve) {
            mostrarError("aviso-nombre-ave", "El nombre del ave no puede quedar vacío.");
            alert("El nombre del ave no puede quedar vacío.");
            return;
        }
        if (nombreAve.length < 2 || !/^[\p{L}0-9 .'-]+$/u.test(nombreAve)) {
            mostrarError("aviso-nombre-ave", "Ingresa un nombre de ave válido.");
        } else {
            mostrarError("aviso-nombre-ave", "");
        }
        if (nombreAve.length < 2 || !/^[\p{L}0-9 .'-]+$/u.test(nombreAve)) {
            alert("Ingresa un nombre de ave válido.");
            return;
        }
        if (archivos.length === 0) {
            alert("Debes adjuntar al menos una foto o video.");
            return;
        }
        if (archivos.length > 5) {
            alert("Debes adjuntar entre 1 y 5 fotos o videos.");
            return;
        }
        const formatosValidos = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
        if (Array.from(archivos).some((archivo) => !formatosValidos.includes(archivo.type))) {
            alert("Cada archivo debe ser JPG, PNG, WEBP, MP4 o WEBM.");
            return;
        }
        modal.classList.remove("hidden");
    });

    document.getElementById("btn-confirmar-no").addEventListener("click", () => modal.classList.add("hidden"));
    function abrirBaseEvidencias() {
        return new Promise((resolve, reject) => {
            const solicitud = indexedDB.open("avistamientosDB", 1);
            solicitud.onupgradeneeded = () => {
                solicitud.result.createObjectStore("evidencias");
            };
            solicitud.onsuccess = () => resolve(solicitud.result);
            solicitud.onerror = () => reject(solicitud.error);
        });
    }

    async function guardarEvidenciasTemporales(id, archivos) {
        const base = await abrirBaseEvidencias();
        const referencias = archivos.map((archivo, indice) => ({
            id: `${id}-${indice}`,
            tipo: archivo.type,
            nombre: archivo.name
        }));
        await new Promise((resolve, reject) => {
            const transaccion = base.transaction("evidencias", "readwrite");
            referencias.forEach((referencia, indice) => {
                transaccion.objectStore("evidencias").put({
                    tipo: referencia.tipo,
                    nombre: referencia.nombre,
                    blob: archivos[indice]
                }, referencia.id);
            });
            transaccion.oncomplete = resolve;
            transaccion.onerror = () => reject(transaccion.error);
        });
        base.close();
        return referencias;
    }

    /* Se conserva para registros anteriores que ya usaban datos URL. */
    function convertirArchivoADataUrl(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.onload = () => resolve({ tipo: archivo.type, nombre: archivo.name, datos: lector.result });
            lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
            lector.readAsDataURL(archivo);
        });
    }

    document.getElementById("btn-confirmar-si").addEventListener("click", async () => {
        try {
            let avistamientos = [];
            try {
                const guardados = JSON.parse(localStorage.getItem("avistamientos") || "[]");
                avistamientos = Array.isArray(guardados) ? guardados : [];
            } catch (error) {
                avistamientos = [];
            }

            const idAvistamiento = Date.now();
            const archivosSeleccionados = Array.from(document.getElementById("evidencia").files);
            const evidencia = await guardarEvidenciasTemporales(idAvistamiento, archivosSeleccionados);
            avistamientos.push({
                id: idAvistamiento,
                tipoAve: document.getElementById("tipo_ave").value,
                nombreAve: document.getElementById("nombre_ave").value.trim(),
                lugar: document.getElementById("sector").value.trim(),
                fecha: fechaInput.value,
                hora: horaInput.value,
                region: document.getElementById("region").value,
                comuna: document.getElementById("comuna").value,
                emailVoluntario: emailVoluntarioAutorizado,
                evidencia
            });

            localStorage.setItem("avistamientos", JSON.stringify(avistamientos));
            modal.classList.add("hidden");
            alert("Avistamiento registrado correctamente.");
            window.location.href = "index.html";
        } catch (error) {
            alert("No se pudo guardar el avistamiento en este navegador.");
        }
    });
});

