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

document.addEventListener("DOMContentLoaded", () => {
    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");
    const guardados = JSON.parse(localStorage.getItem("avistamientos") || "[]");
    const avistamiento = guardados.find((registro) => String(registro.id) === id);

    const registro = avistamiento || {
        tipoAve: "urbanas_jardin",
        nombreAve: "Zorzal",
        region: "Región Metropolitana",
        comuna: "Santiago",
        lugar: "Parque O'Higgins",
        fecha: "2026-08-20",
        hora: "10:30",
        emailVoluntario: "Ejemplo"
    };

    document.getElementById("det-titulo").textContent = registro.nombreAve;
    document.getElementById("det-categoria").textContent = categoriasAves[registro.tipoAve] || registro.tipoAve || "No informado";
    document.getElementById("det-nombre-ave").textContent = registro.nombreAve || "No informado";
    document.getElementById("det-region").textContent = registro.region || "No informada";
    document.getElementById("det-comuna").textContent = registro.comuna || "No informada";
    document.getElementById("det-ubicacion").textContent = registro.lugar || "No informado";
    document.getElementById("det-fecha").textContent = `${registro.fecha || "No informada"} ${registro.hora || ""}`;
    document.getElementById("det-voluntario").textContent = registro.emailVoluntario || "No informado";
    document.getElementById("det-descripcion").textContent = registro.descripcion || "Sin descripción.";

    const galeria = document.getElementById("galeria-fotos");
    const evidencias = Array.isArray(registro.evidencia) ? registro.evidencia : [];
    evidencias.forEach((evidencia) => {
        if (!evidencia.datos) return;
        const elemento = evidencia.tipo.startsWith("video/")
            ? document.createElement("video")
            : document.createElement("img");
        elemento.src = evidencia.datos;
        elemento.controls = evidencia.tipo.startsWith("video/");
        elemento.alt = evidencia.nombre || "Evidencia del avistamiento";
        if (elemento.tagName === "VIDEO") elemento.setAttribute("aria-label", elemento.alt);
        galeria.appendChild(elemento);
    });
});
