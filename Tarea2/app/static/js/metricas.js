const categoriasAves = {
    urbanas_jardin: "Urbanas y jardín",
    pajaros_canto: "Canto y silvestres",
    rapaces_carroneras: "Rapaces y carroñeras",
    acuaticas_nadadoras: "Acuáticas y nadadoras",
    zancudas_orilla: "Zancudas y de orilla",
    marinas_pelagicas: "Marinas y pelágicas",
    carpinteros_trepadores: "Carpinteros y trepadores",
    perdices_terrestres: "Palomas y perdices"
};

const regionesYComunas = {
    "Región de Valparaíso": ["Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana"],
    "Región Metropolitana": ["Santiago", "Providencia", "Las Condes", "Ñuñoa", "Maipú", "La Florida", "Cerrillos"],
    "Región del Biobío": ["Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante"]
};

const todasLasRegiones = Object.keys(regionesYComunas);
const todosLosTipos = Object.values(categoriasAves);
const avistamientoEjemplo = {
    id: "ejemplo",
    tipoAve: "urbanas_jardin",
    nombreAve: "Zorzal",
    region: "Región Metropolitana",
    comuna: "Santiago",
    lugar: "Parque O'Higgins",
    fecha: "2026-08-20",
    hora: "10:30"
};
const tiposAntiguos = {
    "Ave urbana": "urbanas_jardin",
    "Ave rapaz": "rapaces_carroneras",
    "Ave marina": "marinas_pelagicas",
    "Ave acuática": "acuaticas_nadadoras",
    "Ave de bosque": "pajaros_canto",
    "Aves Urbanas y de Jardín": "urbanas_jardin",
    "Pájaros de Canto y Silvestres": "pajaros_canto",
    "Rapaces y Carroñeras": "rapaces_carroneras",
    "Aves Acuáticas y Nadadoras": "acuaticas_nadadoras",
    "Aves Zancudas y de Orilla": "zancudas_orilla",
    "Aves Marinas y Pelágicas": "marinas_pelagicas",
    "Carpinteros y Trepadores": "carpinteros_trepadores",
    "Palomas Silvestres y Perdices": "perdices_terrestres"
};

document.addEventListener("DOMContentLoaded", () => {
    const region = document.getElementById("metrica-region");

    function leerLista(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave) || "[]");
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            return [];
        }
    }

    Object.keys(regionesYComunas).forEach((nombreRegion) => {
        const opcion = document.createElement("option");
        opcion.value = nombreRegion;
        opcion.textContent = nombreRegion;
        region.appendChild(opcion);
    });

    region.addEventListener("change", actualizarGraficos);
    document.getElementById("form-metricas").addEventListener("submit", (event) => {
        event.preventDefault();
        actualizarGraficos();
    });

    function coincideUbicacion(item) {
        return !region.value || item.region === region.value;
    }

    function dibujarBarras(canvasId, datos, colores, total) {
        const canvas = document.getElementById(canvasId);
        const contexto = canvas.getContext("2d");
        const ancho = canvas.width;
        const alto = canvas.height;
        const margenInferior = 125;
        const baseGrafico = alto - margenInferior;
        const alturaGrafico = baseGrafico - 25;
        const maximo = Math.max(1, ...datos.map((dato) => dato.valor));
        contexto.clearRect(0, 0, ancho, alto);
        contexto.font = "13px Arial";
        contexto.fillStyle = "#333";
        if (typeof total === "number") {
            contexto.textAlign = "right";
            contexto.fillText(`Total: ${total}`, ancho - 12, 20);
            contexto.textAlign = "left";
        }
        if (datos.length === 0) {
            contexto.fillText("No hay datos para esta selección.", 20, 40);
            return;
        }

        const espacio = ancho / datos.length;

        function dividirEtiqueta(etiqueta, maximoCaracteres) {
            const palabras = etiqueta.split(" ");
            const lineas = [];
            let linea = "";
            palabras.forEach((palabra) => {
                if ((linea + " " + palabra).trim().length <= maximoCaracteres) {
                    linea = `${linea} ${palabra}`.trim();
                } else {
                    if (linea) lineas.push(linea);
                    linea = palabra;
                }
            });
            if (linea) lineas.push(linea);
            return lineas;
        }

        datos.forEach((dato, indice) => {
            const altura = (dato.valor / maximo) * alturaGrafico;
            const x = indice * espacio + espacio * 0.2;
            const y = baseGrafico - altura;
            contexto.fillStyle = colores[indice % colores.length];
            contexto.fillRect(x, y, espacio * 0.6, altura);
            contexto.fillStyle = "#333";
            contexto.fillText(String(dato.valor), x + 8, y - 8);
            contexto.save();
            contexto.font = "11px Arial";
            contexto.textAlign = "center";
            const centroBarra = x + (espacio * 0.6) / 2;
            const maximoCaracteres = Math.max(6, Math.floor((espacio * 0.8) / 6));
            dividirEtiqueta(dato.etiqueta, maximoCaracteres).forEach((linea, numeroLinea) => {
                contexto.fillText(linea, centroBarra, baseGrafico + 20 + numeroLinea * 14);
            });
            contexto.restore();
        });
    }

    function actualizarGraficos() {
        const usuarios = leerLista("usuariosVoluntarios");
        let usuarioActual = null;
        try {
            usuarioActual = JSON.parse(localStorage.getItem("voluntarioRegistrado") || "null");
        } catch (error) {
            usuarioActual = null;
        }
        if (usuarioActual && !usuarios.some((usuario) => usuario.email === usuarioActual.email)) {
            usuarios.push(usuarioActual);
        }
        const usuarioPorEmail = Object.fromEntries(usuarios.map((usuario) => [usuario.email, usuario]));
        const avistamientosGuardados = leerLista("avistamientos").map((avistamiento) => ({
            ...avistamiento,
            tipoAve: tiposAntiguos[avistamiento.tipoAve] || avistamiento.tipoAve,
            region: avistamiento.region || usuarioPorEmail[avistamiento.emailVoluntario]?.region || usuarioActual?.region || "",
            comuna: avistamiento.comuna || usuarioPorEmail[avistamiento.emailVoluntario]?.comuna || usuarioActual?.comuna || ""
        }));
        const avistamientos = [avistamientoEjemplo, ...avistamientosGuardados];
        const usuariosFiltrados = usuarios.filter(coincideUbicacion);
        const avistamientosFiltrados = avistamientos.filter(coincideUbicacion);
        const agrupacionUsuarios = {};

        usuariosFiltrados.forEach((usuario) => {
            const clave = region.value
                ? (usuario.comuna || "Sin comuna")
                : (usuario.region || "Sin región");
            agrupacionUsuarios[clave] = (agrupacionUsuarios[clave] || 0) + 1;
        });

        const etiquetasUsuarios = region.value ? regionesYComunas[region.value] : todasLasRegiones;
        const datosUsuarios = etiquetasUsuarios.map((etiqueta) => ({
            etiqueta,
            valor: agrupacionUsuarios[etiqueta] || 0
        }));
        const agrupacionTipos = {};
        avistamientosFiltrados.forEach((avistamiento) => {
            const tipo = categoriasAves[avistamiento.tipoAve] || "Otros";
            agrupacionTipos[tipo] = (agrupacionTipos[tipo] || 0) + 1;
        });
        const etiquetasTipos = Object.keys(agrupacionTipos).includes("Otros")
            ? [...todosLosTipos, "Otros"]
            : todosLosTipos;
        const datosAvistamientos = etiquetasTipos.map((etiqueta) => ({
            etiqueta,
            valor: agrupacionTipos[etiqueta] || 0
        }));
        const agrupacionAvistamientosRegion = {};
        avistamientos.forEach((avistamiento) => {
            const nombreRegion = avistamiento.region || "Sin región";
            agrupacionAvistamientosRegion[nombreRegion] = (agrupacionAvistamientosRegion[nombreRegion] || 0) + 1;
        });
        const regionesConDatos = Object.keys(agrupacionAvistamientosRegion).filter((nombreRegion) => !todasLasRegiones.includes(nombreRegion));
        const etiquetasRegionesAvistamientos = [...todasLasRegiones, ...regionesConDatos];
        const datosAvistamientosRegion = etiquetasRegionesAvistamientos.map((etiqueta) => ({
            etiqueta,
            valor: agrupacionAvistamientosRegion[etiqueta] || 0
        }));

        document.getElementById("resumen-usuarios").textContent = `Total: ${usuariosFiltrados.length}`;
        document.getElementById("resumen-avistamientos").textContent = `Total: ${avistamientosFiltrados.length}`;
        document.getElementById("resumen-avistamientos-region").textContent = `Total: ${avistamientos.length}`;
        document.getElementById("titulo-avistamientos-tipo").textContent = region.value
            ? `Avistamientos por tipo de ave en la región de ${region.value}`
            : "Avistamientos por tipo de ave en todas las regiones";
        dibujarBarras("grafico-usuarios", datosUsuarios, ["#8fd3e8", "#004085"], usuariosFiltrados.length);
        dibujarBarras("grafico-avistamientos", datosAvistamientos, ["#8fd3e8", "#004085"]);
        dibujarBarras("grafico-avistamientos-region", datosAvistamientosRegion, ["#8fd3e8", "#004085"], avistamientos.length);
    }

    window.addEventListener("storage", actualizarGraficos);
    window.addEventListener("focus", actualizarGraficos);
    actualizarGraficos();
});
