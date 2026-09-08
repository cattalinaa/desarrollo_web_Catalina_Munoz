document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-voluntario");
    const modal = document.getElementById("modal-confirmacion-voluntario");
    const btnSi = document.getElementById("btn-confirmar-voluntario-si");
    const btnNo = document.getElementById("btn-confirmar-voluntario-no");

    if (!form) return;

    let datosVoluntarioPendiente = null;
    const regexNombreCampo = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?:[-'][A-Za-zÁÉÍÓÚáéíóúÑñ]+)*$/;
    const camposPersonales = [
        ["nombre_voluntario", "aviso-nombre"],
        ["apellido_paterno", "aviso-apellido-paterno"],
        ["apellido_materno", "aviso-apellido-materno"]
    ];

    function mostrarError(idAviso, mensaje) {
        const aviso = document.getElementById(idAviso);
        aviso.textContent = mensaje;
        aviso.classList.toggle("visible", Boolean(mensaje));
    }

    function validarCampoPersonal(idCampo, idAviso) {
        const campo = document.getElementById(idCampo);
        const aviso = document.getElementById(idAviso);
        const valorOriginal = campo.value;
        const valor = valorOriginal.trim();
        let mensaje = "";

        if (!valor) {
            mensaje = "Este campo es obligatorio";
        } else if (/\s/.test(valorOriginal)) {
            mensaje = "Este campo solo acepta una palabra, sin espacios";
        } else if (!regexNombreCampo.test(valor)) {
            mensaje = "Este campo solo acepta letras, guion o apóstrofe";
        }

        aviso.textContent = mensaje;
        aviso.classList.toggle("visible", Boolean(mensaje));
        campo.setCustomValidity(mensaje);
        return !mensaje;
    }

    camposPersonales.forEach(([idCampo, idAviso]) => {
        const campo = document.getElementById(idCampo);
        const validar = () => {
            validarCampoPersonal(idCampo, idAviso);
        };
        campo.addEventListener("blur", validar);
        campo.addEventListener("input", validar);
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombreOriginal = document.getElementById("nombre_voluntario").value;
        const apellidoPaternoOriginal = document.getElementById("apellido_paterno").value;
        const apellidoMaternoOriginal = document.getElementById("apellido_materno").value;
        const nombre = nombreOriginal.trim();
        const apellidoPaterno = apellidoPaternoOriginal.trim();
        const apellidoMaterno = apellidoMaternoOriginal.trim();
        const email = document.getElementById("email_voluntario").value.trim();
        const telefono = document.getElementById("telefono_voluntario").value.trim();
        const region = document.getElementById("region").value;
        const comuna = document.getElementById("comuna").value;
        const regexNombre = regexNombreCampo;
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        const regexTel = /^\+569\d{8}$/;

        camposPersonales.forEach(([idCampo, idAviso]) => validarCampoPersonal(idCampo, idAviso));

        if (!nombre || !apellidoPaterno || !apellidoMaterno) {
            alert("Los campos de nombre y apellidos no pueden quedar vacíos.");
            return;
        }
        if ([nombreOriginal, apellidoPaternoOriginal, apellidoMaternoOriginal].some((campo) => /\s/.test(campo))) {
            alert("Los campos de nombre y apellidos no pueden contener espacios en blanco.");
            return;
        }
        if (!regexNombre.test(nombre) || !regexNombre.test(apellidoPaterno) || !regexNombre.test(apellidoMaterno)) {
            alert("Ingrese nombre, apellido paterno y apellido materno usando solo letras.");
            return;
        }
        if (!email) {
            mostrarError("aviso-email", "El correo electrónico no puede quedar vacío.");
            alert("El correo electrónico no puede quedar vacío.");
            return;
        }
        if (!regexEmail.test(email)) {
            mostrarError("aviso-email", "Ingrese un correo electrónico válido.");
            alert("Ingrese un correo electrónico válido.");
            return;
        }
        mostrarError("aviso-email", "");
        if (!telefono) {
            mostrarError("aviso-telefono", "El teléfono no puede quedar vacío.");
            alert("El teléfono no puede quedar vacío.");
            return;
        }
        if (!regexTel.test(telefono)) {
            mostrarError("aviso-telefono", "El teléfono debe tener el formato +56912345678.");
            alert("El teléfono debe seguir el formato chileno: +56912345678.");
            return;
        }
        mostrarError("aviso-telefono", "");
        if (!region) {
            mostrarError("aviso-region", "Debe seleccionar una región de Chile.");
            alert("Debe seleccionar una región de Chile.");
            return;
        }
        mostrarError("aviso-region", "");
        if (!comuna) {
            mostrarError("aviso-comuna", "Debe seleccionar una comuna de Chile.");
            alert("Debe seleccionar una comuna de Chile.");
            return;
        }
        mostrarError("aviso-comuna", "");

        // Guardar temporalmente los datos del voluntario
        datosVoluntarioPendiente = {
            nombre: `${nombre} ${apellidoPaterno} ${apellidoMaterno}`,
            nombreSolo: nombre,
            apellidoPaterno,
            apellidoMaterno,
            email,
            telefono: telefono,
            region,
            comuna,
        };

        modal.classList.remove("hidden");
    });

    btnNo.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    btnSi.addEventListener("click", () => {
        modal.classList.add("hidden");
        
        // Guardar sesión del voluntario en LocalStorage para validar autorizaciones
        localStorage.setItem("voluntarioRegistrado", JSON.stringify(datosVoluntarioPendiente));
        const emailsRegistrados = JSON.parse(localStorage.getItem("emailsVoluntarios") || "[]");
        if (!emailsRegistrados.includes(datosVoluntarioPendiente.email)) {
            emailsRegistrados.push(datosVoluntarioPendiente.email);
            localStorage.setItem("emailsVoluntarios", JSON.stringify(emailsRegistrados));
        }
        const usuariosRegistrados = JSON.parse(localStorage.getItem("usuariosVoluntarios") || "[]");
        if (!usuariosRegistrados.some((usuario) => usuario.email === datosVoluntarioPendiente.email)) {
            usuariosRegistrados.push(datosVoluntarioPendiente);
            localStorage.setItem("usuariosVoluntarios", JSON.stringify(usuariosRegistrados));
        }

        alert("¡Registro exitoso! Ahora tienes permisos autorizados para agregar e informar avistamientos.");
        window.location.href = "avistamiento_register.html";
    });
});