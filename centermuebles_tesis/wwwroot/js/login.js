// CONSTANTES PARA LÍMITES DE CARACTERES
const LIMITES = {
    NOMBRE_USUARIO: {
        MIN: 3,
        MAX: 20
    },
    EMAIL: {
        MAX: 100
    },
    PASSWORD: {
        MIN: 6,
        MAX: 50
    },
    NOMBRE_COMPLETO: {
        MIN: 2,
        MAX: 100
    },
    TELEFONO: {
        MIN: 7,
        MAX: 15
    },
    DIRECCION: {
        MIN: 5,
        MAX: 200
    },
    CODIGO_POSTAL: {
        MIN: 4,
        MAX: 10
    }
};

// VALIDACIONES DE FORMULARIOS DE LOGIN
function validarFormularioLogin() {
    let valido = true;
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

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
    } else if (email.length > LIMITES.EMAIL.MAX) {
        mostrarError('login-email', `El email no puede tener más de ${LIMITES.EMAIL.MAX} caracteres`);
        valido = false;
    }

    if (!password) {
        mostrarError('login-password', 'La contraseña es requerida');
        valido = false;
    } else if (password.length > LIMITES.PASSWORD.MAX) {
        mostrarError('login-password', `La contraseña no puede tener más de ${LIMITES.PASSWORD.MAX} caracteres`);
        valido = false;
    }

    return valido;
}

function validarFormularioRegistro() {
    let valido = true;

    const modalRegister = document.getElementById('modal-register');
    if (!modalRegister) {
        mostrarMensajeModal('register', 'Error: Formulario no disponible', 'error');
        return false;
    }

    const nombreUsuarioInput = modalRegister.querySelector('#reg-nombreUsuario');
    const emailInput = modalRegister.querySelector('#reg-email');
    const passwordInput = modalRegister.querySelector('#reg-password');
    const nombreCompletoInput = modalRegister.querySelector('#reg-nombreCompleto');
    const telefonoInput = modalRegister.querySelector('#reg-telefono');
    const direccionInput = modalRegister.querySelector('#reg-direccion');
    const codigoPostalInput = modalRegister.querySelector('#reg-codigoPostal');

    if (!nombreUsuarioInput || !emailInput || !passwordInput || !nombreCompletoInput || !telefonoInput || !direccionInput || !codigoPostalInput) {
        console.error('Elementos del formulario de registro no encontrados');
        mostrarMensajeModal('register', 'Error: Formulario incompleto', 'error');
        return false;
    }

    const nombreUsuario = nombreUsuarioInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nombreCompleto = nombreCompletoInput.value.trim();
    const telefono = telefonoInput.value.trim();
    const direccion = direccionInput.value.trim();
    const codigoPostal = codigoPostalInput.value.trim();

    limpiarMensajesError();

    // Validación nombre de usuario
    if (!nombreUsuario) {
        mostrarError('reg-nombreUsuario', 'El nombre de usuario es requerido');
        valido = false;
    } else if (nombreUsuario.length < LIMITES.NOMBRE_USUARIO.MIN) {
        mostrarError('reg-nombreUsuario', `El nombre de usuario debe tener al menos ${LIMITES.NOMBRE_USUARIO.MIN} caracteres`);
        valido = false;
    } else if (nombreUsuario.length > LIMITES.NOMBRE_USUARIO.MAX) {
        mostrarError('reg-nombreUsuario', `El nombre de usuario no puede tener más de ${LIMITES.NOMBRE_USUARIO.MAX} caracteres`);
        valido = false;
    }

    // Validación email
    if (!email) {
        mostrarError('reg-email', 'El email es requerido');
        valido = false;
    } else if (email.length > LIMITES.EMAIL.MAX) {
        mostrarError('reg-email', `El email no puede tener más de ${LIMITES.EMAIL.MAX} caracteres`);
        valido = false;
    } else if (!validarEmail(email)) {
        mostrarError('reg-email', 'El formato del email no es válido');
        valido = false;
    }

    // Validación contraseña
    if (!password) {
        mostrarError('reg-password', 'La contraseña es requerida');
        valido = false;
    } else if (password.length < LIMITES.PASSWORD.MIN) {
        mostrarError('reg-password', `La contraseña debe tener al menos ${LIMITES.PASSWORD.MIN} caracteres`);
        valido = false;
    } else if (password.length > LIMITES.PASSWORD.MAX) {
        mostrarError('reg-password', `La contraseña no puede tener más de ${LIMITES.PASSWORD.MAX} caracteres`);
        valido = false;
    }

    // Validación nombre completo
    const nombreCompletoError = validarNombreCompleto(nombreCompleto);
    if (nombreCompletoError) {
        mostrarError('reg-nombreCompleto', nombreCompletoError);
        valido = false;
    }

    // Validación teléfono
    const telefonoError = validarTelefono(telefono);
    if (telefonoError) {
        mostrarError('reg-telefono', telefonoError);
        valido = false;
    }

    // Validación dirección
    const direccionError = validarDireccion(direccion);
    if (direccionError) {
        mostrarError('reg-direccion', direccionError);
        valido = false;
    }

    // Validación código postal
    const codigoPostalError = validarCodigoPostal(codigoPostal);
    if (codigoPostalError) {
        mostrarError('reg-codigoPostal', codigoPostalError);
        valido = false;
    }

    return valido;
}

// FUNCIONES DE VALIDACIÓN ACTUALIZADAS
function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= LIMITES.EMAIL.MAX;
}

function validarPassword(password) {
    return password.length >= LIMITES.PASSWORD.MIN && password.length <= LIMITES.PASSWORD.MAX;
}

function validarNombreCompleto(nombreCompleto) {
    if (!nombreCompleto) {
        return 'El nombre completo es requerido';
    }
    if (nombreCompleto.length < LIMITES.NOMBRE_COMPLETO.MIN) {
        return `El nombre completo debe tener al menos ${LIMITES.NOMBRE_COMPLETO.MIN} caracteres`;
    }
    if (nombreCompleto.length > LIMITES.NOMBRE_COMPLETO.MAX) {
        return `El nombre completo no puede tener más de ${LIMITES.NOMBRE_COMPLETO.MAX} caracteres`;
    }
    return null;
}

function validarTelefono(telefono) {
    if (!telefono) {
        return 'El teléfono es requerido';
    }
    if (telefono.length < LIMITES.TELEFONO.MIN) {
        return `El teléfono debe tener al menos ${LIMITES.TELEFONO.MIN} caracteres`;
    }
    if (telefono.length > LIMITES.TELEFONO.MAX) {
        return `El teléfono no puede tener más de ${LIMITES.TELEFONO.MAX} caracteres`;
    }
    const telefonoRegex = /^[0-9+\-\s()]+$/;
    if (!telefonoRegex.test(telefono)) {
        return 'El formato del teléfono no es válido';
    }
    return null;
}

function validarDireccion(direccion) {
    if (!direccion) {
        return 'La dirección es requerida';
    }
    if (direccion.length < LIMITES.DIRECCION.MIN) {
        return `La dirección debe tener al menos ${LIMITES.DIRECCION.MIN} caracteres`;
    }
    if (direccion.length > LIMITES.DIRECCION.MAX) {
        return `La dirección no puede tener más de ${LIMITES.DIRECCION.MAX} caracteres`;
    }
    return null;
}

function validarCodigoPostal(codigoPostal) {
    if (!codigoPostal) {
        return 'El código postal es requerido';
    }
    if (codigoPostal.length < LIMITES.CODIGO_POSTAL.MIN) {
        return `El código postal debe tener al menos ${LIMITES.CODIGO_POSTAL.MIN} caracteres`;
    }
    if (codigoPostal.length > LIMITES.CODIGO_POSTAL.MAX) {
        return `El código postal no puede tener más de ${LIMITES.CODIGO_POSTAL.MAX} caracteres`;
    }
    const codigoPostalRegex = /^[0-9a-zA-Z\-\s]+$/;
    if (!codigoPostalRegex.test(codigoPostal)) {
        return 'El formato del código postal no es válido';
    }
    return null;
}

// LOGIN Y REGISTRO
async function register(userData) {
    try {
        console.log('📝 Enviando datos de registro:', {
            ...userData,
            contraseña: '***'
        });

        const response = await fetch(`${API_USUARIO}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                NombreUsuario: userData.nombreUsuario,
                Email: userData.email,
                Contraseña: userData.contraseña,
                NombreCompleto: userData.nombreCompleto,
                Telefono: userData.telefono,
                Direccion: userData.direccion,
                CodigoPostal: userData.codigoPostal
            })
        });

        const data = await response.json();
        console.log('📨 Respuesta del registro:', data);

        if (response.ok) {
            return { success: true, data: data };
        } else {
            return { success: false, message: data.mensaje || 'Error en el registro' };
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        return { success: false, message: 'Error de conexión con el servidor' };
    }
}

async function login(event) {
    if (event) event.preventDefault();

    console.log('🔄 Iniciando proceso de login...');

    if (!validarFormularioLogin()) {
        console.log('❌ Validación de formulario falló');
        return;
    }

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    if (!emailInput || !passwordInput) {
        mostrarMensajeModal('login', 'Error: Campos no encontrados', 'error');
        return;
    }

    const credencial = emailInput.value.trim();
    const password = passwordInput.value;

    // Validar límites antes de enviar
    if (credencial.length > LIMITES.EMAIL.MAX) {
        mostrarMensajeModal('login', `El email no puede tener más de ${LIMITES.EMAIL.MAX} caracteres`, 'error');
        return;
    }

    if (password.length > LIMITES.PASSWORD.MAX) {
        mostrarMensajeModal('login', `La contraseña no puede tener más de ${LIMITES.PASSWORD.MAX} caracteres`, 'error');
        return;
    }

    const formData = {
        Email: credencial,
        Contraseña: password
    };

    try {
        const boton = document.querySelector('#login-form button[type="submit"]');
        if (boton) {
            boton.innerHTML = '<span class="loading-spinner"></span> Procesando...';
            boton.disabled = true;
            boton.classList.add('btn-loading');
        }

        const response = await fetch(`${API_USUARIO}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));

            const esAdmin = esUsuarioAdministrador(data.usuario);
            const mensaje = esAdmin
                ? '¡Login exitoso! Bienvenido Administrador'
                : '¡Login exitoso! Bienvenido/a';

            mostrarMensajeModal('login', mensaje, 'success');
            actualizarInterfazUsuario();

            setTimeout(() => {
                cerrarModal('modal-login');
                window.location.reload();
            }, 1500);
        } else {
            const mensajeError = data.mensaje || 'Error en el login';
            mostrarMensajeModal('login', mensajeError, 'error');
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        mostrarMensajeModal('login', 'Error de conexión con el servidor', 'error');
    } finally {
        const boton = document.querySelector('#login-form button[type="submit"]');
        if (boton) {
            boton.innerHTML = 'Ingresar';
            boton.disabled = false;
            boton.classList.remove('btn-loading');
        }
    }
}

async function registrar(event) {
    if (event) event.preventDefault();

    console.log('🔄 Iniciando proceso de registro...');

    if (!validarFormularioRegistro()) {
        console.log('❌ Validación de formulario de registro falló');
        return;
    }

    const modalRegister = document.getElementById('modal-register');
    if (!modalRegister) {
        mostrarMensajeModal('register', 'Error: Formulario no disponible', 'error');
        return;
    }

    const nombreUsuarioInput = document.getElementById('reg-nombreUsuario');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const nombreCompletoInput = document.getElementById('reg-nombreCompleto');
    const telefonoInput = document.getElementById('reg-telefono');
    const direccionInput = document.getElementById('reg-direccion');
    const codigoPostalInput = document.getElementById('reg-codigoPostal');

    if (!nombreUsuarioInput || !emailInput || !passwordInput || !nombreCompletoInput) {
        mostrarMensajeModal('register', 'Error: Campos del formulario no encontrados', 'error');
        return;
    }

    const nombreUsuario = nombreUsuarioInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nombreCompleto = nombreCompletoInput.value.trim();
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';
    const direccion = direccionInput ? direccionInput.value.trim() : '';
    const codigoPostal = codigoPostalInput ? codigoPostalInput.value.trim() : '';

    // Validaciones adicionales de límites antes de enviar
    if (nombreUsuario.length > LIMITES.NOMBRE_USUARIO.MAX) {
        mostrarMensajeModal('register', `El nombre de usuario no puede tener más de ${LIMITES.NOMBRE_USUARIO.MAX} caracteres`, 'error');
        return;
    }

    if (email.length > LIMITES.EMAIL.MAX) {
        mostrarMensajeModal('register', `El email no puede tener más de ${LIMITES.EMAIL.MAX} caracteres`, 'error');
        return;
    }

    if (password.length > LIMITES.PASSWORD.MAX) {
        mostrarMensajeModal('register', `La contraseña no puede tener más de ${LIMITES.PASSWORD.MAX} caracteres`, 'error');
        return;
    }

    if (nombreCompleto.length > LIMITES.NOMBRE_COMPLETO.MAX) {
        mostrarMensajeModal('register', `El nombre completo no puede tener más de ${LIMITES.NOMBRE_COMPLETO.MAX} caracteres`, 'error');
        return;
    }

    if (telefono.length > LIMITES.TELEFONO.MAX) {
        mostrarMensajeModal('register', `El teléfono no puede tener más de ${LIMITES.TELEFONO.MAX} caracteres`, 'error');
        return;
    }

    if (direccion.length > LIMITES.DIRECCION.MAX) {
        mostrarMensajeModal('register', `La dirección no puede tener más de ${LIMITES.DIRECCION.MAX} caracteres`, 'error');
        return;
    }

    if (codigoPostal.length > LIMITES.CODIGO_POSTAL.MAX) {
        mostrarMensajeModal('register', `El código postal no puede tener más de ${LIMITES.CODIGO_POSTAL.MAX} caracteres`, 'error');
        return;
    }

    const formData = {
        nombreUsuario: nombreUsuario,
        email: email,
        contraseña: password,
        nombreCompleto: nombreCompleto,
        telefono: telefono,
        direccion: direccion,
        codigoPostal: codigoPostal
    };

    try {
        const boton = document.querySelector('#register-form button[type="submit"]');
        if (boton) {
            boton.innerHTML = '<span class="loading-spinner"></span> Procesando...';
            boton.disabled = true;
            boton.classList.add('btn-loading');
        }

        const result = await register(formData);

        if (result.success) {
            mostrarMensajeModal('register', '¡Registro exitoso! Redirigiendo al login...', 'success');

            setTimeout(() => {
                cerrarModal('modal-register');
                mostrarLogin();
            }, 2000);
        } else {
            mostrarMensajeModal('register', result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        mostrarMensajeModal('register', 'Error de conexión con el servidor', 'error');
    } finally {
        const boton = document.querySelector('#register-form button[type="submit"]');
        if (boton) {
            boton.innerHTML = 'Registrarse';
            boton.disabled = false;
            boton.classList.remove('btn-loading');
        }
    }
}