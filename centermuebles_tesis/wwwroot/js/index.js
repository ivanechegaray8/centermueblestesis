// INICIALIZACIÓN PRINCIPAL
document.addEventListener('DOMContentLoaded', function () {
    // Event listeners de formularios
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('register-form').addEventListener('submit', registrar);

    // Inicializar sistemas
    inicializarBuscador();
    verificarAutenticacion();
    cargarPaginaPrincipal();
    actualizarContadorCarrito();
    verificarLoginAutomatico();

    console.log('✅ Aplicación inicializada correctamente');
});

// Event listeners globales
document.addEventListener('click', function (event) {
    if (!event.target.closest('.admin-dropdown')) {
        const menu = document.getElementById('admin-menu');
        if (menu) menu.classList.remove('show');
    }
});

// Scroll suave para botón "Ver Ofertas"
document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "btn-ver-ofertas") {
        const destino = document.getElementById("featured-products");
        const header = document.querySelector(".top-nav");
        const headerAltura = header ? header.offsetHeight : 0;

        if (!destino) {
            console.error("❌ No existe la sección #featured-products en esta página.");
            return;
        }

        const separacionExtra = -70;
        window.scrollTo({
            top: destino.offsetTop - headerAltura - separacionExtra,
            behavior: "smooth"
        });
    }
});