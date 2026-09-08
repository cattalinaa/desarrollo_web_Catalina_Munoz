const regionesYComunas = {
    "Región de Valparaíso": ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana"],
    "Región Metropolitana": ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Cerrillos"],
    "Región del Biobío": ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante"]
};

document.addEventListener("DOMContentLoaded", () => {
    const selectRegion = document.getElementById("region");
    const selectComuna = document.getElementById("comuna");

    if (!selectRegion || !selectComuna) return;

    Object.keys(regionesYComunas).forEach(region => {
        const option = document.createElement("option");
        option.value = region;
        option.textContent = region;
        selectRegion.appendChild(option);
    });

    selectRegion.addEventListener("change", (e) => {
        const regionSeleccionada = e.target.value;
        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent = "-- Seleccione Comuna --";
        selectComuna.replaceChildren(opcionInicial);

        if (regionSeleccionada && regionesYComunas[regionSeleccionada]) {
            regionesYComunas[regionSeleccionada].forEach(comuna => {
                const option = document.createElement("option");
                option.value = comuna;
                option.textContent = comuna;
                selectComuna.appendChild(option);
            });
            selectComuna.disabled = false;
        } else {
            selectComuna.disabled = true;
        }
    });
});