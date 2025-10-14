// ==================== CONFIGURACIÓN ====================
const API_BASE = 'http://localhost:5269';
const API_PRODUCTOS = `${API_BASE}/api/productos`;
const API_CATEGORIAS = `${API_BASE}/api/categorias`;
const API_SUBCATEGORIAS = `${API_BASE}/api/subcategorias`;
const API_USUARIO = `${API_BASE}/api/usuario`;

// Variables globales
let productos = [];
let productosFiltrados = [];
let editandoProducto = false;
let usuarioLogueado = null;
let modalAbierto = null;

// ==================== SISTEMA DE BÚSQUEDA ====================
// ==================== SISTEMA DE BÚSQUEDA EN TIEMPO REAL ====================
let searchTimeout;
let selectedSuggestionIndex = -1;
let currentSuggestions = [];

function inicializarBusqueda() {
    const searchInput = document.getElementById('search-input');
    const suggestionsContainer = document.getElementById('search-suggestions');

    if (!searchInput || !suggestionsContainer) {
        console.log('❌ Elementos de búsqueda no encontrados');
        return;
    }

    // Búsqueda en tiempo real
    searchInput.addEventListener('input', function (e) {
        const termino = e.target.value.trim();

        clearTimeout(searchTimeout);

        if (termino.length < 2) {
            ocultarSugerencias();
            return;
        }

        searchTimeout = setTimeout(() => {
            buscarSugerencias(termino);
        }, 300);
    });

    // Navegación con teclado
    searchInput.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navegarSugerencias(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                navegarSugerencias(-1);
                break;
            case 'Enter':
                e.preventDefault();
                seleccionarSugerenciaActual();
                break;
            case 'Escape':
                ocultarSugerencias();
                break;
        }
    });

    // Ocultar sugerencias al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            ocultarSugerencias();
        }
    });

    console.log('✅ Sistema de búsqueda inicializado');
}

function buscarSugerencias(termino) {
    console.log('🔍 Buscando sugerencias para:', termino);

    const terminoLower = termino.toLowerCase();

    // Filtrar productos que coincidan con el término de búsqueda
    const sugerencias = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(terminoLower)
    ).slice(0, 8); // Limitar a 8 sugerencias

    mostrarSugerencias(sugerencias, termino);
}

function mostrarSugerencias(sugerencias, terminoBusqueda) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    const searchInput = document.getElementById('search-input');

    if (!suggestionsContainer || !searchInput) return;

    currentSuggestions = sugerencias;
    selectedSuggestionIndex = -1;

    if (sugerencias.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="no-results">
                🔍 No se encontraron productos para "${terminoBusqueda}"
            </div>
        `;
    } else {
        suggestionsContainer.innerHTML = sugerencias.map((producto, index) => `
            <div class="suggestion-item" data-index="${index}" data-product-id="${producto.idProducto}">
                <div class="suggestion-icon">📦</div>
                <div class="suggestion-text">${resaltarCoincidencia(producto.nombre, terminoBusqueda)}</div>
                <div class="suggestion-category">$${producto.precio}</div>
            </div>
        `).join('');

        // Agregar event listeners a las sugerencias
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function () {
                const productId = this.getAttribute('data-product-id');
                seleccionarProducto(parseInt(productId));
            });

            item.addEventListener('mouseenter', function () {
                selectedSuggestionIndex = parseInt(this.getAttribute('data-index'));
                actualizarSeleccionSugerencias();
            });
        });
    }

    suggestionsContainer.classList.add('active');
}

function resaltarCoincidencia(texto, termino) {
    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<strong>$1</strong>');
}

function navegarSugerencias(direccion) {
    if (!currentSuggestions.length) return;

    selectedSuggestionIndex += direccion;

    if (selectedSuggestionIndex < 0) {
        selectedSuggestionIndex = currentSuggestions.length - 1;
    } else if (selectedSuggestionIndex >= currentSuggestions.length) {
        selectedSuggestionIndex = 0;
    }

    actualizarSeleccionSugerencias();
}

function actualizarSeleccionSugerencias() {
    const items = document.querySelectorAll('.suggestion-item');
    items.forEach(item => item.classList.remove('selected'));

    if (selectedSuggestionIndex >= 0) {
        items[selectedSuggestionIndex]?.classList.add('selected');
    }
}

function seleccionarSugerenciaActual() {
    if (selectedSuggestionIndex >= 0 && currentSuggestions[selectedSuggestionIndex]) {
        seleccionarProducto(currentSuggestions[selectedSuggestionIndex].idProducto);
    } else {
        // Si no hay sugerencia seleccionada, realizar búsqueda normal
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value.trim()) {
            buscarProductos(searchInput.value.trim());
            ocultarSugerencias();
        }
    }
}

function seleccionarProducto(productId) {
    console.log('🎯 Producto seleccionado:', productId);

    // Redirigir a la página de detalle del producto
    verDetalleProducto(productId);
    ocultarSugerencias();
}

function ocultarSugerencias() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.remove('active');
        selectedSuggestionIndex = -1;
        currentSuggestions = [];
    }
}

// Modificar la función buscarProductos existente para que también oculte sugerencias
function buscarProductos(termino) {
    console.log('🔍 Buscando productos con término:', termino);

    if (!termino) {
        productosFiltrados = [...productos];
        mostrarProductos(productos);
        ocultarSugerencias();
        return;
    }

    productosFiltrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase())
    );

    console.log('✅ Productos encontrados:', productosFiltrados.length);
    mostrarProductos(productosFiltrados);
    ocultarSugerencias();
}

function buscarProductos(termino) {
    console.log('🔍 Buscando productos con término:', termino);

    if (!termino) {
        // Si no hay término de búsqueda, mostrar todos los productos
        productosFiltrados = [...productos];
        mostrarProductos(productos);
        return;
    }

    // Filtrar productos por nombre
    productosFiltrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(termino)
    );

    console.log('✅ Productos encontrados:', productosFiltrados.length);
    mostrarProductos(productosFiltrados);
}

function mostrarProductos(listaProductos) {
    const grid = document.querySelector('.products-grid');

    if (!grid) {
        console.log('ℹ️ products-grid no encontrado');
        return;
    }

    if (!listaProductos || listaProductos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3>No se encontraron productos</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';

    listaProductos.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        productCard.innerHTML = `
            <div class="product-image">
                ${producto.rutaImagen ?
                `<img src="${producto.rutaImagen}" alt="${producto.nombre}" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#666;\\'>📷 Sin imagen</div>';">` :
                '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">📷 Sin imagen</div>'
            }
            </div>
            <div class="product-info">
                <h3>${producto.nombre}</h3>
                <p class="product-price">$${producto.precio}</p>
                <p>Stock: ${producto.stock}</p>
                <button class="btn-leer-mas" onclick="verDetalleProducto(${producto.idProducto})">
                    📖 Leer Más
                </button>
                <button class="btn-agregar-carrito" onclick="agregarAlCarrito(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                    🛒 Agregar al Carrito
                </button>
            </div>
        `;
        grid.appendChild(productCard);
    });
}

// ==================== SISTEMA DE AUTENTICACIÓN ====================
function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    if (token && usuario) {
        usuarioLogueado = JSON.parse(usuario);
        console.log('🔐 Usuario autenticado:', usuarioLogueado);
        actualizarInterfazUsuario();
        return true;
    }
    return false;
}

// FUNCIÓN MEJORADA: Detectar si es administrador
function esUsuarioAdministrador(usuario) {
    if (!usuario) return false;

    // Verificar por rol
    if (usuario.rol) {
        const rol = usuario.rol.toString().toLowerCase().trim();
        console.log('🔍 Verificando rol:', rol);

        const esAdminPorRol = rol === 'administrador' ||
            rol === 'admin' ||
            rol.includes('admin') ||
            rol === 'administrator';

        if (esAdminPorRol) return true;
    }

    // Si no hay rol, verificar por email o nombre de usuario
    const email = usuario.email ? usuario.email.toLowerCase() : '';
    const nombreUsuario = usuario.nombreUsuario ? usuario.nombreUsuario.toLowerCase() : '';

    // Detectar admin por email o nombre de usuario
    const esAdminPorCredenciales = email.includes('admin') ||
        nombreUsuario.includes('admin') ||
        email === 'ivanechegaray888@gmail.com' ||
        nombreUsuario === 'admin' ||
        nombreUsuario === 'administrador';

    console.log('🔍 Detectando admin por credenciales:', { email, nombreUsuario, esAdminPorCredenciales });
    return esAdminPorCredenciales;
}

function actualizarInterfazUsuario() {
    const userActions = document.getElementById('user-actions');

    if (usuarioLogueado) {
        console.log('👤 Actualizando interfaz para usuario:', usuarioLogueado.nombreUsuario);

        // Detección automática del rol
        const esAdmin = esUsuarioAdministrador(usuarioLogueado);
        console.log('⚙️ ¿Es administrador?:', esAdmin);

        // Usuario logueado
        userActions.innerHTML = `
            <a href="carrito.html" class="cart-link">
                🛒 Carrito
                <span class="cart-count" style="display: none;">0</span>
            </a>
            <div class="user-info" style="display: flex; align-items: center; gap: 10px;">
                <span class="user-name">Hola, ${usuarioLogueado.nombreUsuario}</span>
                ${esAdmin ?
                `<div class="admin-dropdown">
                        <button class="admin-toggle" onclick="toggleAdminMenu()">
                            ⚙️ Admin
                        </button>
                        <div class="admin-menu" id="admin-menu">
                            <a href="admin.html" class="admin-menu-item">Panel Admin</a>
                            <a href="#" class="admin-menu-item" onclick="cerrarSesion()">Cerrar Sesión</a>
                        </div>
                    </div>` :
                `<button class="btn-logout" onclick="cerrarSesion()">Cerrar Sesión</button>`
            }
            </div>
        `;

        console.log('✅ Interfaz de usuario actualizada');

    } else {
        // Usuario no logueado
        console.log('👤 Usuario no logueado, mostrando botones de auth');
        userActions.innerHTML = `
            <div class="auth-buttons">
                <button class="auth-btn secondary" onclick="mostrarLogin()">Ingresar</button>
                <button class="auth-btn" onclick="mostrarRegistro()">Registrarse</button>
            </div>
            <a href="carrito.html" class="cart-link">
                🛒 Carrito
                <span class="cart-count" style="display: none;">0</span>
            </a>
        `;
    }

    // Actualizar contador del carrito
    actualizarContadorCarrito();
}

function toggleAdminMenu() {
    const adminMenu = document.getElementById('admin-menu');
    if (adminMenu) {
        adminMenu.classList.toggle('show');
        console.log('📋 Menú admin toggled:', adminMenu.classList.contains('show'));
    }
}

function mostrarPanelAdmin() {
    // Redireccionar a la página de administración
    window.location.href = 'admin.html';
}

function cerrarSesion() {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    usuarioLogueado = null;
    actualizarInterfazUsuario();
    window.location.reload();
}

// Cerrar menú desplegable al hacer clic fuera
document.addEventListener('click', function (event) {
    const adminDropdown = document.querySelector('.admin-dropdown');
    const adminMenu = document.getElementById('admin-menu');

    if (adminDropdown && adminMenu && !adminDropdown.contains(event.target)) {
        adminMenu.classList.remove('show');
    }
});

// ==================== SISTEMA DE MODALES MEJORADO ====================
function mostrarLogin() {
    abrirModal('modal-login');
}

function mostrarRegistro() {
    abrirModal('modal-register');
}

function abrirModal(modalId) {
    // Cerrar cualquier modal abierto
    if (modalAbierto) {
        cerrarModal(modalAbierto);
    }

    // Abrir el nuevo modal
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modalAbierto = modalId;
    }

    // Limpiar mensajes de error al abrir modal
    limpiarMensajesError();
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
    if (modalAbierto === modalId) {
        modalAbierto = null;
    }

    // Limpiar formularios al cerrar
    limpiarFormularios();
}

// Cerrar modal al hacer click fuera del contenido o presionar ESC
window.onclick = function (event) {
    if (modalAbierto && event.target.classList.contains('modal')) {
        cerrarModal(modalAbierto);
    }
}

document.addEventListener('keydown', function (event) {
    if (modalAbierto && event.key === 'Escape') {
        cerrarModal(modalAbierto);
    }
});

// ==================== VALIDACIÓN DE FORMULARIOS ====================
function limpiarMensajesError() {
    const errores = document.querySelectorAll('.error-message');
    errores.forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });

    const inputs = document.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));
}

function limpiarFormularios() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();

    limpiarMensajesError();

    // Ocultar mensajes de éxito/error
    const mensajeLogin = document.getElementById('mensaje-login');
    const mensajeRegister = document.getElementById('mensaje-register');

    if (mensajeLogin) mensajeLogin.style.display = 'none';
    if (mensajeRegister) mensajeRegister.style.display = 'none';
}

function mostrarError(campoId, mensaje) {
    const campo = document.getElementById(campoId);
    const errorDiv = document.getElementById(`error-${campoId}`);

    if (campo) {
        campo.classList.add('input-error');
    }

    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.classList.add('show');
    }
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validarPassword(password) {
    return password.length >= 6;
}

function validarFormularioLogin() {
    let valido = true;
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // Verificar que los elementos existen
    if (!emailInput || !passwordInput) {
        console.error('Elementos del formulario de login no encontrados');
        return false;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    limpiarMensajesError();

    if (!email) {
        mostrarError('login-email', 'El email o usuario es requerido');
        valido = false;
    }

    if (!password) {
        mostrarError('login-password', 'La contraseña es requerida');
        valido = false;
    }

    return valido;
}

function validarFormularioRegistro() {
    let valido = true;

    // Buscar elementos dentro del modal
    const modalRegister = document.getElementById('modal-register');
    if (!modalRegister) {
        mostrarMensajeModal('register', 'Error: Formulario no disponible', 'error');
        return false;
    }

    const nombreUsuarioInput = modalRegister.querySelector('#reg-nombreUsuario');
    const emailInput = modalRegister.querySelector('#reg-email');
    const passwordInput = modalRegister.querySelector('#reg-password');

    // Verificar que todos los elementos existen
    if (!nombreUsuarioInput || !emailInput || !passwordInput) {
        console.error('Elementos del formulario de registro no encontrados');
        mostrarMensajeModal('register', 'Error: Formulario incompleto', 'error');
        return false;
    }

    const nombreUsuario = nombreUsuarioInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    limpiarMensajesError();

    // Validar nombre de usuario
    if (!nombreUsuario) {
        mostrarError('reg-nombreUsuario', 'El nombre de usuario es requerido');
        valido = false;
    } else if (nombreUsuario.length < 3) {
        mostrarError('reg-nombreUsuario', 'El nombre de usuario debe tener al menos 3 caracteres');
        valido = false;
    }

    // Validar email
    if (!email) {
        mostrarError('reg-email', 'El email es requerido');
        valido = false;
    } else if (!validarEmail(email)) {
        mostrarError('reg-email', 'El formato del email no es válido');
        valido = false;
    }

    // Validar contraseña
    if (!password) {
        mostrarError('reg-password', 'La contraseña es requerida');
        valido = false;
    } else if (!validarPassword(password)) {
        mostrarError('reg-password', 'La contraseña debe tener al menos 6 caracteres');
        valido = false;
    }

    return valido;
}

// ==================== FUNCIONES DE LOGIN/REGISTRO ====================
async function login(event) {
    event.preventDefault();

    // Validar formulario antes de enviar
    if (!validarFormularioLogin()) {
        return;
    }

    const formData = {
        Email: document.getElementById('login-email').value.trim(),
        Contraseña: document.getElementById('login-password').value
    };

    try {
        // Mostrar estado de carga
        const boton = event.target.querySelector('button[type="submit"]');
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<span class="loading-spinner"></span> Procesando...';
        boton.disabled = true;
        boton.classList.add('btn-loading');

        console.log('🔐 Intentando login con datos:', formData);

        const response = await fetch(`${API_USUARIO}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('📨 Respuesta completa del login:', data);

        if (response.ok) {
            // Guardar datos en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            // Detectar automáticamente si es admin
            const esAdmin = esUsuarioAdministrador(data.usuario);
            console.log('🎯 ¿Usuario es administrador después del login?:', esAdmin);

            // Mostrar mensaje personalizado
            const mensaje = esAdmin
                ? '¡Login exitoso! Bienvenido Administrador'
                : '¡Login exitoso!';

            mostrarMensajeModal('login', mensaje, 'success');

            setTimeout(() => {
                cerrarModal('modal-login');
                window.location.reload();
            }, 1500);
        } else {
            mostrarMensajeModal('login', data.mensaje || 'Error en el login', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensajeModal('login', 'Error de conexión con el servidor', 'error');
    } finally {
        // Restaurar botón
        if (event.target && event.target.querySelector('button[type="submit"]')) {
            const boton = event.target.querySelector('button[type="submit"]');
            boton.innerHTML = 'Ingresar';
            boton.disabled = false;
            boton.classList.remove('btn-loading');
        }
    }
}

async function registrar(event) {
    event.preventDefault();

    // Validar formulario antes de enviar
    if (!validarFormularioRegistro()) {
        return;
    }

    // Buscar elementos dentro del modal
    const modalRegister = document.getElementById('modal-register');
    if (!modalRegister) {
        mostrarMensajeModal('register', 'Error: Formulario no disponible', 'error');
        return;
    }

    const nombreUsuarioInput = modalRegister.querySelector('#reg-nombreUsuario');
    const emailInput = modalRegister.querySelector('#reg-email');
    const passwordInput = modalRegister.querySelector('#reg-password');

    // Verificar nuevamente que los elementos existen
    if (!nombreUsuarioInput || !emailInput || !passwordInput) {
        mostrarMensajeModal('register', 'Error: Formulario incompleto', 'error');
        return;
    }

    const nombreUsuario = nombreUsuarioInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const formData = {
        NombreUsuario: nombreUsuario,
        Email: email,
        Contraseña: password
    };

    try {
        // Mostrar estado de carga
        const boton = event.target.querySelector('button[type="submit"]');
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '<span class="loading-spinner"></span> Procesando...';
        boton.disabled = true;
        boton.classList.add('btn-loading');

        console.log('Enviando datos de registro:', formData);

        const response = await fetch(`${API_USUARIO}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('Respuesta del registro:', data);

        if (response.ok) {
            mostrarMensajeModal('register', '¡Registro exitoso! Redirigiendo al login...', 'success');

            setTimeout(() => {
                cerrarModal('modal-register');
                mostrarLogin();
            }, 2000);
        } else {
            mostrarMensajeModal('register', data.mensaje || 'Error en el registro', 'error');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensajeModal('register', 'Error de conexión con el servidor', 'error');
    } finally {
        // Restaurar botón
        if (event.target && event.target.querySelector('button[type="submit"]')) {
            const boton = event.target.querySelector('button[type="submit"]');
            boton.innerHTML = 'Registrarse';
            boton.disabled = false;
            boton.classList.remove('btn-loading');
        }
    }
}

function mostrarMensajeModal(tipo, texto, clase) {
    const mensajeDiv = document.getElementById(`mensaje-${tipo}`);
    if (mensajeDiv) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${clase}`;
        mensajeDiv.style.display = 'block';

        if (clase === 'success') {
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando aplicación...');

    // Verificar autenticación primero
    verificarAutenticacion();

    // Inicializar interfaz de usuario
    actualizarInterfazUsuario();

    // Inicializar sistema de búsqueda
    inicializarBusqueda();

    // Cargar datos de la tienda (siempre se cargan)
    cargarProductosTienda();

    // Event listeners para formularios
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', login);
        console.log('✅ Formulario de login encontrado y configurado');
    } else {
        console.error('❌ Formulario de login NO encontrado');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', registrar);
        console.log('✅ Formulario de registro encontrado y configurado');
    } else {
        console.error('❌ Formulario de registro NO encontrado');
    }

    // Agregar validación en tiempo real
    agregarValidacionEnTiempoReal();
});

function agregarValidacionEnTiempoReal() {
    // Validación en tiempo real para registro - buscar en el modal
    const modalRegister = document.getElementById('modal-register');
    if (modalRegister) {
        const camposRegistro = ['reg-nombreUsuario', 'reg-email', 'reg-password'];

        camposRegistro.forEach(campoId => {
            const campo = modalRegister.querySelector(`#${campoId}`);
            if (campo) {
                campo.addEventListener('blur', function () {
                    // Solo validar si el campo tiene valor
                    if (this.value.trim()) {
                        validarCampoIndividual(this.id, this.value.trim());
                    }
                });

                campo.addEventListener('input', function () {
                    // Remover error cuando el usuario empiece a escribir
                    if (this.classList.contains('input-error')) {
                        this.classList.remove('input-error');
                        const errorDiv = document.getElementById(`error-${this.id}`);
                        if (errorDiv) {
                            errorDiv.classList.remove('show');
                        }
                    }
                });
            }
        });
    }

    // Validación en tiempo real para login
    const modalLogin = document.getElementById('modal-login');
    if (modalLogin) {
        const camposLogin = ['login-email', 'login-password'];
        camposLogin.forEach(campoId => {
            const campo = modalLogin.querySelector(`#${campoId}`);
            if (campo) {
                campo.addEventListener('input', function () {
                    // Remover error cuando el usuario empiece a escribir
                    if (this.classList.contains('input-error')) {
                        this.classList.remove('input-error');
                        const errorDiv = document.getElementById(`error-${this.id}`);
                        if (errorDiv) {
                            errorDiv.classList.remove('show');
                        }
                    }
                });
            }
        });
    }
}

function validarCampoIndividual(campoId, valor) {
    switch (campoId) {
        case 'reg-nombreUsuario':
            if (valor.length < 3) {
                mostrarError(campoId, 'El nombre de usuario debe tener al menos 3 caracteres');
                return false;
            }
            break;
        case 'reg-email':
            if (!validarEmail(valor)) {
                mostrarError(campoId, 'El formato del email no es válido');
                return false;
            }
            break;
        case 'reg-password':
            if (!validarPassword(valor)) {
                mostrarError(campoId, 'La contraseña debe tener al menos 6 caracteres');
                return false;
            }
            break;
    }
    return true;
}

// ==================== FUNCIONES DE PRODUCTOS ====================
// FUNCIÓN: Cargar productos en la tienda
async function cargarProductosTienda() {
    try {
        console.log('🔄 Cargando productos para la tienda...');
        const response = await fetch(API_PRODUCTOS);

        if (!response.ok) {
            throw new Error(`Error ${response.status} al cargar productos`);
        }

        productos = await response.json();
        productosFiltrados = [...productos]; // Inicializar productos filtrados
        console.log('✅ Productos cargados:', productos);

        const grid = document.querySelector('.products-grid');

        // VERIFICAR SI EL ELEMENTO EXISTE ANTES DE MANIPULARLO
        if (!grid) {
            console.log('ℹ️ products-grid no encontrado (probablemente en admin.html)');
            return; // Salir silenciosamente si no está en esta página
        }

        if (!productos || productos.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div>📦</div>
                    <h3>No hay productos disponibles</h3>
                </div>
            `;
            return;
        }

        mostrarProductos(productos);

    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        const grid = document.querySelector('.products-grid');

        // VERIFICAR SI EL ELEMENTO EXISTE ANTES DE MOSTRAR ERROR
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div>⚠️</div>
                    <h3>Error al cargar productos</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// FUNCIÓN: Cargar lista de productos en el panel admin
function cargarListaProductosAdmin() {
    try {
        const contenedor = document.getElementById('contenedor-lista-productos');
        if (!contenedor) {
            console.error('❌ Contenedor de lista de productos no encontrado');
            return;
        }

        if (!productos || productos.length === 0) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div>📦</div>
                    <h3>No hay productos cargados</h3>
                    <p>Usa el formulario de arriba para agregar tu primer producto</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '';
        productos.forEach(producto => {
            const productoItem = document.createElement('div');
            productoItem.className = 'producto-item';

            const productoId = producto.idProducto || producto.id;
            const productoNombre = producto.nombre;
            const productoPrecio = producto.precio;
            const productoStock = producto.stock;
            const productoDescripcion = producto.descripcion || '';

            productoItem.innerHTML = `
                <div class="producto-info">
                    <div class="producto-nombre">${productoNombre}</div>
                    <div class="producto-detalles">
                        <span class="producto-precio">$${productoPrecio}</span>
                        <span class="producto-stock">Stock: ${productoStock}</span>
                        ${productoDescripcion ? `| ${productoDescripcion.substring(0, 50)}${productoDescripcion.length > 50 ? '...' : ''}` : ''}
                    </div>
                </div>
                <div class="producto-acciones">
                    <button class="btn-editar" onclick="editarProducto(${productoId})">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${productoId})">
                        🗑️ Eliminar
                    </button>
                </div>
            `;
            contenedor.appendChild(productoItem);
        });

    } catch (error) {
        console.error('❌ Error al cargar lista de productos:', error);
        const contenedor = document.getElementById('contenedor-lista-productos');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div>⚠️</div>
                    <h3>Error al cargar productos</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// FUNCIÓN: Cargar categorías
async function cargarCategorias() {
    try {
        console.log('🔍 Cargando categorías desde:', API_CATEGORIAS);
        const response = await fetch(API_CATEGORIAS);

        if (!response.ok) {
            throw new Error(`Error ${response.status} al cargar categorías`);
        }

        const categorias = await response.json();
        console.log('✅ Categorías cargadas:', categorias);

        const selectCategoria = document.getElementById('categoria');
        if (selectCategoria) {
            selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';

            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.idCategoria;
                option.textContent = cat.nombre;
                selectCategoria.appendChild(option);
            });
        }

    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        mostrarMensaje('❌ Error al cargar categorías: ' + error.message, 'error');
    }
}

// FUNCIÓN: Cargar subcategorías
async function cargarSubcategorias(idCategoria) {
    console.log('🔍 Cargando subcategorías para categoría:', idCategoria);
    const selectSubcategoria = document.getElementById('subcategoria');
    if (!selectSubcategoria) return;

    if (!idCategoria) {
        selectSubcategoria.innerHTML = '<option value="">Primero selecciona una categoría</option>';
        selectSubcategoria.disabled = true;
        return;
    }

    try {
        selectSubcategoria.innerHTML = '<option value="">Cargando subcategorías...</option>';
        selectSubcategoria.disabled = true;

        const response = await fetch(API_SUBCATEGORIAS);

        if (!response.ok) {
            throw new Error(`Error ${response.status} al cargar subcategorías`);
        }

        const todasSubcategorias = await response.json();

        const subcategoriasFiltradas = todasSubcategorias.filter(sub => {
            return sub.idCategoria == idCategoria;
        });

        selectSubcategoria.innerHTML = '<option value="">Seleccionar subcategoría</option>';

        if (subcategoriasFiltradas.length === 0) {
            selectSubcategoria.innerHTML = '<option value="">No hay subcategorías para esta categoría</option>';
        } else {
            subcategoriasFiltradas.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.idSubcategoria;
                option.textContent = sub.nombre;
                selectSubcategoria.appendChild(option);
            });
            selectSubcategoria.disabled = false;
        }

    } catch (error) {
        console.error('❌ Error al cargar subcategorías:', error);
        selectSubcategoria.innerHTML = '<option value="">Error al cargar subcategorías</option>';
    }
}

// FUNCIÓN: Gestionar producto (crear o actualizar)
async function gestionarProducto(event) {
    event.preventDefault();

    // Verificar si el usuario está logueado y es administrador
    if (!usuarioLogueado || !esUsuarioAdministrador(usuarioLogueado)) {
        mostrarMensaje('❌ Solo los administradores pueden gestionar productos', 'error');
        return;
    }

    const boton = document.getElementById('btn-submit');
    const mensajeDiv = document.getElementById('mensaje-admin');
    const idSubcategoria = document.getElementById('subcategoria').value;

    if (!idSubcategoria) {
        mostrarMensaje('❌ Por favor selecciona una categoría y subcategoría válida', 'error');
        return;
    }

    try {
        boton.innerHTML = '⏳ Procesando...';
        boton.disabled = true;
        if (mensajeDiv) mensajeDiv.style.display = 'none';

        const token = localStorage.getItem('token');
        const producto = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            idSubcategoria: parseInt(idSubcategoria),
            rutaImagen: document.getElementById('imagen').value || null
        };

        let response;
        let metodo = 'POST';
        let url = API_PRODUCTOS;

        if (editandoProducto) {
            const productoId = document.getElementById('producto-id').value;
            metodo = 'PUT';
            url = `${API_PRODUCTOS}/${productoId}`;
            producto.idProducto = parseInt(productoId);
        }

        console.log(`📤 Enviando producto (${metodo}):`, producto);

        response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const resultado = await response.json();

        const mensaje = editandoProducto ?
            '✅ Producto actualizado exitosamente!' :
            '✅ Producto cargado exitosamente!';

        mostrarMensaje(mensaje, 'success');
        resetearFormulario();

        // CARGAR PRODUCTOS SOLO SI ESTAMOS EN LA PÁGINA CORRECTA
        await cargarProductosTienda(); // Esto ahora maneja el caso de que no exista products-grid

    } catch (error) {
        console.error('❌ Error completo:', error);
        mostrarMensaje('❌ Error al procesar producto: ' + error.message, 'error');
    } finally {
        if (boton) {
            boton.innerHTML = editandoProducto ? '✏️ Actualizar Producto' : '➕ Agregar Producto';
            boton.disabled = false;
        }
    }
}

// FUNCIÓN: Editar producto
async function editarProducto(id) {
    if (!usuarioLogueado || !esUsuarioAdministrador(usuarioLogueado)) {
        mostrarMensaje('❌ Solo los administradores pueden editar productos', 'error');
        return;
    }

    try {
        console.log(`🔄 Iniciando edición del producto ID: ${id}`);

        let producto = productos.find(p => p.idProducto == id);

        if (!producto) {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_PRODUCTOS}/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Producto no encontrado');
            producto = await response.json();
        }

        console.log('📝 Producto a editar:', producto);

        document.getElementById('producto-id').value = producto.idProducto;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('imagen').value = producto.rutaImagen || '';

        if (producto.idSubcategoria) {
            try {
                const response = await fetch(`${API_SUBCATEGORIAS}/${producto.idSubcategoria}`);
                if (response.ok) {
                    const subcategoria = await response.json();
                    const idCategoria = subcategoria.idCategoria;

                    if (idCategoria) {
                        document.getElementById('categoria').value = idCategoria;
                        await cargarSubcategorias(idCategoria);

                        setTimeout(() => {
                            document.getElementById('subcategoria').value = producto.idSubcategoria;
                        }, 500);
                    }
                }
            } catch (error) {
                console.error('Error al cargar subcategoría:', error);
            }
        }

        editandoProducto = true;
        document.getElementById('btn-submit').innerHTML = '✏️ Actualizar Producto';
        document.getElementById('btn-submit').classList.add('btn-update');
        document.getElementById('btn-cancel').style.display = 'block';

        document.getElementById('form-producto').scrollIntoView({ behavior: 'smooth' });
        mostrarMensaje(`📝 Editando producto: ${producto.nombre}`, 'info');

    } catch (error) {
        console.error('❌ Error al editar producto:', error);
        mostrarMensaje('❌ Error al cargar datos del producto: ' + error.message, 'error');
    }
}

// FUNCIÓN: Eliminar producto
async function eliminarProducto(id) {
    if (!usuarioLogueado || !esUsuarioAdministrador(usuarioLogueado)) {
        mostrarMensaje('❌ Solo los administradores pueden eliminar productos', 'error');
        return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        console.log(`🗑️ Eliminando producto ID: ${id}`);
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status} al eliminar producto`);
        }

        console.log('✅ Producto eliminado exitosamente');
        mostrarMensaje('✅ Producto eliminado exitosamente', 'success');
        await cargarProductosTienda();

    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        mostrarMensaje('❌ Error al eliminar producto: ' + error.message, 'error');
    }
}

// FUNCIÓN: Cancelar edición
function cancelarEdicion() {
    editandoProducto = false;
    resetearFormulario();
    mostrarMensaje('Edición cancelada', 'info');
}

// FUNCIÓN: Resetear formulario
function resetearFormulario() {
    const form = document.getElementById('form-producto');
    if (form) form.reset();

    const productoId = document.getElementById('producto-id');
    if (productoId) productoId.value = '';

    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.innerHTML = '➕ Agregar Producto';
        btnSubmit.classList.remove('btn-update');
    }

    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) btnCancel.style.display = 'none';

    const subcategoria = document.getElementById('subcategoria');
    if (subcategoria) {
        subcategoria.innerHTML = '<option value="">Primero selecciona una categoría</option>';
        subcategoria.disabled = true;
    }

    editandoProducto = false;
}

// FUNCIÓN: Mostrar mensajes
function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje-admin');
    if (mensajeDiv) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        mensajeDiv.style.display = 'block';

        if (tipo === 'success') {
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// ==================== FUNCIONES DEL CARRITO ====================
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();

    // Verificar si el producto ya está en el carrito
    const productoExistente = carrito.find(item => item.id === (producto.idProducto || producto.id));

    if (productoExistente) {
        productoExistente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.idProducto || producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.rutaImagen,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    mostrarNotificacionCarrito('✅ Producto agregado al carrito');
    actualizarContadorCarrito();
}

function eliminarDelCarrito(productoId) {
    const carrito = obtenerCarrito();
    const nuevoCarrito = carrito.filter(item => item.id !== productoId);
    guardarCarrito(nuevoCarrito);
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);

    // Actualizar el contador en la interfaz si existe
    const contadoresCarrito = document.querySelectorAll('.cart-count');
    contadoresCarrito.forEach(contador => {
        contador.textContent = totalItems;
        contador.style.display = totalItems > 0 ? 'inline' : 'none';
    });
}

function mostrarNotificacionCarrito(mensaje) {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-carrito';
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

// Redirección al carrito
function irAlCarrito() {
    window.location.href = 'carrito.html';
}

// Función para redirigir a la página de detalle del producto
function verDetalleProducto(productoId) {
    window.location.href = `detalle-producto.html?id=${productoId}`;
}

// ==================== FUNCIONES UTILITARIAS ====================
// FUNCIÓN: Debug para verificar estado
function debugEstado() {
    console.log('=== DEBUG ESTADO ===');
    console.log('Usuario logueado:', usuarioLogueado);
    console.log('Token en localStorage:', localStorage.getItem('token'));
    console.log('Usuario en localStorage:', localStorage.getItem('usuario'));
    console.log('Carrito:', obtenerCarrito());
    console.log('====================');
}

// FUNCIÓN PARA FORZAR MODO ADMIN (SOLO PRUEBAS)
function forzarModoAdmin() {
    localStorage.setItem('usuario', JSON.stringify({
        nombreUsuario: 'admin',
        rol: 'Administrador',
        email: 'admin@test.com'
    }));
    localStorage.setItem('token', 'test-token-admin');
    location.reload();
}

// Inicializar carrito cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    actualizarContadorCarrito();
});