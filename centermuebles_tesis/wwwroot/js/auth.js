// SISTEMA DE AUTENTICACIÓN
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    if (token && usuario) {
        usuarioLogueado = JSON.parse(usuario);
        console.log('Usuario autenticado:', usuarioLogueado);
        actualizarInterfazUsuario();
        return true;
    }
    return false;
}

function esUsuarioAdministrador(usuario) {
    if (!usuario) return false;

    if (usuario.rol) {
        const rol = usuario.rol.toString().toLowerCase();
        if (rol.includes('admin') || rol.includes('administrador')) {
            return true;
        }
    }

    const email = usuario.email ? usuario.email.toLowerCase() : '';
    const nombreUsuario = usuario.nombreUsuario ? usuario.nombreUsuario.toLowerCase() : '';

    return email.includes('admin') ||
        nombreUsuario.includes('admin') ||
        nombreUsuario === 'admin' ||
        nombreUsuario === 'administrador';
}

function actualizarInterfazUsuario() {
    const userActions = document.getElementById('user-actions');

    if (!userActions) return;

    if (usuarioLogueado) {
        const esAdmin = esUsuarioAdministrador(usuarioLogueado);

        userActions.innerHTML = `
            <a href="carrito.html" class="cart-link">
                🛒 Carrito
                <span class="cart-count" id="cart-count" style="display: none;">0</span>
            </a>
            <div class="user-info">
                <span class="user-name">Hola, ${usuarioLogueado.nombreUsuario}</span>
                ${esAdmin ? `
                    <div class="admin-dropdown">
                        <button class="admin-toggle" onclick="toggleAdminMenu()">Admin</button>
                        <div class="admin-menu" id="admin-menu">
                            <a href="admin.html" class="admin-menu-item">Gestion de productos</a>
                            <a href="ventas.html" class="admin-menu-item">Ventas</a>
                            <a href="#" class="admin-menu-item" onclick="cerrarSesion()">Cerrar Sesión</a>
                        </div>
                    </div>
                ` : `
                    <div class="user-dropdown">
                        <div class="user-menu" id="user-menu">
                            <a href="#" class="user-menu-item" onclick="cerrarSesion()">Cerrar Sesión</a>
                        </div>
                    </div>
                `}
            </div>
        `;
    } else {
        userActions.innerHTML = `
            <div class="auth-buttons">
                <button class="auth-btn secondary" onclick="mostrarLogin()">Ingresar</button>
                <button class="auth-btn primary" onclick="mostrarRegistro()">Registrarse</button>
            </div>
            <a href="carrito.html" class="cart-link">
                🛒 Carrito
                <span class="cart-count" id="cart-count" style="display: none;">0</span>
            </a>
        `;
    }

    actualizarContadorCarrito();
}

function toggleAdminMenu() {
    const menu = document.getElementById('admin-menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    usuarioLogueado = null;
    actualizarInterfazUsuario();
    window.location.reload();
}