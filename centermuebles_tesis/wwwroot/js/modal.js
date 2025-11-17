// MANEJO DE MODALES
function mostrarLogin() {
    document.getElementById('modal-login').style.display = 'flex';
    modalAbierto = 'modal-login';
}

function mostrarRegistro() {
    document.getElementById('modal-register').style.display = 'flex';
    modalAbierto = 'modal-register';
}

function cerrarModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    modalAbierto = null;
}

// Evento global para cerrar modales
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        cerrarModal(modalAbierto);
    }
}

// DETECCIÓN DE LOGIN AUTOMÁTICO
function verificarLoginAutomatico() {
    const mostrarLogin = localStorage.getItem('mostrarLoginAutomatico');

    if (mostrarLogin === 'true') {
        console.log('🔐 DETECTADO: Mostrar login automático por redirección desde carrito');

        setTimeout(() => {
            const modalLogin = document.getElementById('modal-login');
            if (modalLogin) {
                modalLogin.style.display = 'flex';
                localStorage.removeItem('mostrarLoginAutomatico');
            }
        }, 1000);
    }
}