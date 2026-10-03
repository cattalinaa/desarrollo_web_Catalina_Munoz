document.addEventListener("DOMContentLoaded", () => {
    const campo = document.getElementById("nombre_ave");
    const lista = document.getElementById("lista-aves-sugerencias");

    if (!campo || !lista) return;

    const normalizar = (texto) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let indiceSeleccionado = -1;

    function ocultar() {
        lista.classList.add("hidden");
        lista.replaceChildren();
        indiceSeleccionado = -1;
    }

    function resaltar(items) {
        items.forEach((item, indice) => {
            item.classList.toggle("autocompletar-item-activo", indice === indiceSeleccionado);
        });
    }

    function mostrar(filtradas) {
        lista.replaceChildren();
        filtradas.slice(0, 10).forEach((nombre) => {
            const item = document.createElement("li");
            item.textContent = nombre;
            item.classList.add("autocompletar-item");
            item.addEventListener("mousedown", (event) => {
                event.preventDefault();
                campo.value = nombre;
                ocultar();
            });
            lista.appendChild(item);
        });
        lista.classList.remove("hidden");
        indiceSeleccionado = -1;
    }

    campo.addEventListener("input", () => {
        const escrito = normalizar(campo.value.trim());
        if (!escrito) {
            ocultar();
            return;
        }
        const filtradas = nombresAves.filter((nombre) => normalizar(nombre).includes(escrito));
        if (filtradas.length === 0) {
            ocultar();
            return;
        }
        mostrar(filtradas);
    });

    campo.addEventListener("keydown", (event) => {
        const items = lista.querySelectorAll(".autocompletar-item");
        if (items.length === 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            indiceSeleccionado = Math.min(indiceSeleccionado + 1, items.length - 1);
            resaltar(items);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            indiceSeleccionado = Math.max(indiceSeleccionado - 1, 0);
            resaltar(items);
        } else if (event.key === "Enter" && indiceSeleccionado >= 0) {
            event.preventDefault();
            campo.value = items[indiceSeleccionado].textContent;
            ocultar();
        } else if (event.key === "Escape") {
            ocultar();
        }
    });

    campo.addEventListener("blur", () => {
        setTimeout(ocultar, 150);
    });
});