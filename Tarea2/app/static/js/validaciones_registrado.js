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
    const tipoAve = document.getElementById("tipo_ave");
    const descripcionTipoAve = document.getElementById("descripcion-tipo-ave");

    if (!formAcceso || !formAvistamiento) return;

    function mostrarError(idAviso, mensaje) {
        const aviso = document.getElementById(idAviso);
        aviso.textContent = mensaje;
        aviso.classList.toggle("visible", Boolean(mensaje));
    }

    const categoriasAves = {
        urbanas_jardin: {
            label: "Aves Urbanas y de Jardín",
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

    tipoAve.addEventListener("change", () => {
        const categoria = categoriasAves[tipoAve.value];
        descripcionTipoAve.textContent = categoria ? `${categoria.label}: ${categoria.description}` : "";
    });

    formAcceso.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("email-acceso").value.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            const mensaje = email ? "Ingresa un email válido." : "El email no puede quedar vacío.";
            mostrarError("aviso-acceso", mensaje);
            return;
        }

        const respuesta = await fetch(urlVerificarVoluntario, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ email })
        });
        const resultado = await respuesta.json();

        if (!resultado.valido) {
            mostrarError("aviso-acceso", resultado.mensaje);
            return;
        }

        mostrarError("aviso-acceso", "");
        acceso.classList.add("hidden");
        formAvistamiento.classList.remove("hidden");
        document.getElementById("email_voluntario").value = email;
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
        if (!nombreAve) {
            mostrarError("aviso-nombre-ave", "El nombre del ave no puede quedar vacío.");
            alert("El nombre del ave no puede quedar vacío.");
            return;
        }
        if (nombreAve.length < 2 || !/^[\p{L}0-9 .'-]+$/u.test(nombreAve)) {
            mostrarError("aviso-nombre-ave", "Ingresa un nombre de ave válido.");
            alert("Ingresa un nombre de ave válido.");
            return;
        }
        mostrarError("aviso-nombre-ave", "");
        if (archivos.length === 0) {
            mostrarError("aviso-evidencia", "Debes adjuntar al menos una foto o video.");
            alert("Debes adjuntar al menos una foto o video.");
            return;
        }
        if (archivos.length > 5) {
            mostrarError("aviso-evidencia", "Debes adjuntar entre 1 y 5 fotos o videos.");
            alert("Debes adjuntar entre 1 y 5 fotos o videos.");
            return;
        }
        const formatosValidos = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
        if (Array.from(archivos).some((archivo) => !formatosValidos.includes(archivo.type))) {
            mostrarError("aviso-evidencia", "Cada archivo debe ser JPG, PNG, WEBP, MP4 o WEBM.");
            alert("Cada archivo debe ser JPG, PNG, WEBP, MP4 o WEBM.");
            return;
        }
        mostrarError("aviso-evidencia", "");
        modal.classList.remove("hidden");
    });

    document.getElementById("btn-confirmar-no").addEventListener("click", () => modal.classList.add("hidden"));
    document.getElementById("btn-confirmar-si").addEventListener("click", () => {
        modal.classList.add("hidden");
        formAvistamiento.submit();
    });
});