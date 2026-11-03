document.addEventListener("DOMContentLoaded", () => {
    // 1. Hace la llamada asíncrona a la API que creamos en app.py
    fetch("/api/estadisticas")
        .then((response) => response.json())
        .then((data) => {
            // 2. Gráfico 1: Líneas (Avistamientos por día)
            const ctxDia = document.getElementById("chartDia").getContext("2d");
            new Chart(ctxDia, {
                type: "line",
                data: {
                    labels: data.por_dia.map((item) => item.fecha),
                    datasets: [{
                        label: "Cantidad de Avistamientos",
                        data: data.por_dia.map((item) => item.total),
                        borderColor: "#004085",
                        backgroundColor: "rgba(0, 64, 133, 0.1)",
                        tension: 0.2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });

            // 3. Gráfico 2: Torta (Avistamientos por tipo de ave)
            const ctxAve = document.getElementById("chartAve").getContext("2d");
            new Chart(ctxAve, {
                type: "pie",
                data: {
                    labels: data.por_ave.map((item) => item.ave),
                    datasets: [{
                        data: data.por_ave.map((item) => item.total),
                        backgroundColor: [
                            "#8fd3e8", "#004085", "#2ecc71", "#f1c40f",
                            "#e74c3c", "#9b59b6", "#e67e22", "#34495e"
                        ]
                    }]
                },
                options: { responsive: true }
            });

            // 4. Gráfico 3: Barras (Voluntarios por comuna)
            const ctxComuna = document.getElementById("chartComuna").getContext("2d");
            new Chart(ctxComuna, {
                type: "bar",
                data: {
                    labels: data.por_comuna.map((item) => item.comuna),
                    datasets: [{
                        label: "Voluntarios Registrados",
                        data: data.por_comuna.map((item) => item.total),
                        backgroundColor: "#8fd3e8",
                        borderColor: "#004085",
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }
            });
        })
        .catch((error) => console.error("Error al cargar las estadísticas:", error));
});