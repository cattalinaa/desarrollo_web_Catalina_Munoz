document.addEventListener("DOMContentLoaded", () => {
    const selectRegion = document.getElementById("region");
    const selectComuna = document.getElementById("comuna");

    if (!selectRegion || !selectComuna) return;

    function poblarComunas() {
        const regionSeleccionada = selectRegion.value;
        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "Todas las comunas";
        selectComuna.replaceChildren(opcionInicial);

        const comunas = regionesYComunas[regionSeleccionada] || [];
        comunas.forEach((comuna) => {
            const option = document.createElement("option");
            option.value = String(comuna.id);
            option.textContent = comuna.nombre;
            selectComuna.appendChild(option);
        });
        selectComuna.disabled = comunas.length === 0;

        if (selectComuna.dataset.preseleccion) {
            selectComuna.value = selectComuna.dataset.preseleccion;
        }
    }

    selectRegion.addEventListener("change", poblarComunas);
    if (selectRegion.value) {
        poblarComunas();
    }
});