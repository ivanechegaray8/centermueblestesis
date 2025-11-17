// Variables globales
let datosPago = null;
let pasoActual = 1;
let metodoPagoSeleccionado = 'tarjeta';
let archivoComprobante = null;

// Función para obtener el token JWT
function obtenerToken() {
    const token =
        localStorage.getItem('jwtToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('jwtToken') ||
        sessionStorage.getItem('token');

    console.log('🔐 Token encontrado para pago:', token ? '***' + token.slice(-10) : 'none');
    return token;
}

// Función para verificar autenticación MEJORADA
function verificarAutenticacion() {
    const token = obtenerToken();
    console.log('🔐 Verificando autenticación, token encontrado:', !!token);

    if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        alert('Debes iniciar sesión para realizar una compra');
        window.location.href = 'index.html';
        return false;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const ahora = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < ahora) {
            console.log('❌ Token expirado');
            localStorage.removeItem('jwtToken');
            sessionStorage.removeItem('jwtToken');
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            alert('Tu sesión ha expirado. Por favor iniciá sesión nuevamente.');
            window.location.href = 'index.html';
            return false;
        }

        console.log('✅ Token válido, usuario autenticado');
        return true;
    } catch (error) {
        console.error('❌ Error al verificar token:', error);
        localStorage.removeItem('jwtToken');
        sessionStorage.removeItem('jwtToken');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        alert('Error de autenticación. Por favor iniciá sesión nuevamente.');
        window.location.href = 'index.html';
        return false;
    }
}

// Función para verificar autenticación en tiempo real
function verificarAuthEnTiempoReal() {
    if (!verificarAutenticacion()) {
        return false;
    }

    setInterval(() => {
        if (!verificarAutenticacion()) {
            clearInterval(this);
        }
    }, 30000);

    return true;
}

// Función para formatear números con separadores de miles
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);
}

// Función para formatear número de tarjeta
function formatearNumeroTarjeta(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';

    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }

    input.value = formattedValue;
    actualizarPreviewTarjeta();
    detectarTipoTarjeta(value);
}

// Función para detectar tipo de tarjeta
function detectarTipoTarjeta(numero) {
    const icono = document.getElementById('icono-tarjeta');
    if (icono) {
        if (/^4/.test(numero)) {
            icono.textContent = '💳';
        } else if (/^5[1-5]/.test(numero)) {
            icono.textContent = '💳';
        } else if (/^3[47]/.test(numero)) {
            icono.textContent = '💳';
        } else {
            icono.textContent = '💳';
        }
    }
}

// Función para actualizar preview de tarjeta
function actualizarPreviewTarjeta() {
    const numeroPreview = document.getElementById('tarjeta-numero-preview');
    const nombrePreview = document.getElementById('tarjeta-nombre-preview');
    const vencimientoPreview = document.getElementById('tarjeta-vencimiento-preview');

    if (!numeroPreview || !nombrePreview || !vencimientoPreview) return;

    const numero = document.getElementById('numero-tarjeta')?.value || '';
    const nombre = document.getElementById('nombre-tarjeta')?.value || '';
    const mes = document.getElementById('mes-vencimiento')?.value || '';
    const ano = document.getElementById('ano-vencimiento')?.value || '';

    if (numero) {
        const ultimos4 = numero.replace(/\s/g, '').slice(-4);
        numeroPreview.textContent = '•••• •••• •••• ' + ultimos4;
    } else {
        numeroPreview.textContent = '•••• •••• •••• ••••';
    }

    nombrePreview.textContent = nombre.toUpperCase() || 'NOMBRE EN TARJETA';

    if (mes && ano) {
        vencimientoPreview.textContent = mes + '/' + ano;
    } else {
        vencimientoPreview.textContent = 'MM/AA';
    }
}

// ==================== FUNCIÓN MODIFICADA: Validar tarjeta de crédito (VERSIÓN DEMO) ====================
function validarTarjetaCredito(numero) {
    const cleanNumero = numero.replace(/\s/g, '');

    // En demo, aceptamos cualquier número que tenga entre 13 y 19 dígitos
    if (cleanNumero.length < 13 || cleanNumero.length > 19) {
        alert('El número de tarjeta debe tener entre 13 y 19 dígitos');
        return false;
    }

    if (!/^\d+$/.test(cleanNumero)) {
        alert('El número de tarjeta solo puede contener dígitos');
        return false;
    }

    // ✅ EN DEMO: Siempre retorna true (no validamos algoritmo Luhn)
    console.log('🎭 Demo: Número de tarjeta aceptado (sin validación real)');
    return true;
}

// Función para validar fecha de vencimiento
function validarFechaVencimiento(mes, ano) {
    const ahora = new Date();
    const añoActual = ahora.getFullYear() % 100;
    const mesActual = ahora.getMonth() + 1;

    if (parseInt(ano) < añoActual) {
        return false;
    }

    if (parseInt(ano) === añoActual && parseInt(mes) < mesActual) {
        return false;
    }

    return true;
}

// Función para actualizar monto de transferencia
function actualizarMontoTransferencia() {
    const montoTransferencia = document.getElementById('monto-transferencia');
    const montoTransferenciaTexto = document.getElementById('monto-transferencia-texto');

    if (montoTransferencia && montoTransferenciaTexto && datosPago) {
        const monto = `$${formatearNumero(datosPago.total || 0)}`;
        montoTransferencia.textContent = monto;
        montoTransferenciaTexto.textContent = monto;
    }
}

// ==================== FUNCIÓN CORREGIDA: Seleccionar método de pago ====================
function seleccionarMetodoPago(metodo, event) {
    console.log('🎯 Seleccionando método de pago:', metodo);

    // Prevenir comportamiento por defecto si es un evento
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    metodoPagoSeleccionado = metodo;

    // Remover clase seleccionado de todos los métodos
    document.querySelectorAll('.metodo-pago').forEach(el => {
        el.classList.remove('seleccionado');
    });

    // Agregar clase seleccionado al método actual
    const metodoActual = document.querySelector(`.metodo-pago.${metodo}`);
    if (metodoActual) {
        metodoActual.classList.add('seleccionado');
    }

    // Actualizar texto del botón
    actualizarBotonContinuar();

    console.log('✅ Método de pago seleccionado:', metodoPagoSeleccionado);
}

// Función para actualizar el texto del botón según el método
function actualizarBotonContinuar() {
    const btnPagar = document.getElementById('btn-pagar-tarjeta');
    if (btnPagar) {
        if (metodoPagoSeleccionado === 'efectivo') {
            btnPagar.textContent = 'Continuar a Confirmación';
        } else {
            btnPagar.textContent = 'Continuar con el Pago';
        }
    }
}

// Inicialización MEJORADA
document.addEventListener('DOMContentLoaded', function () {
    console.log('💳 Inicializando página...');

    // Verificar autenticación al cargar la página
    if (!verificarAuthEnTiempoReal()) {
        return;
    }

    // Si estamos en la página de pago, cargar datos de pago
    if (document.getElementById('pago-contenido')) {
        cargarDatosPago();
        // Actualizar botón al cargar
        actualizarBotonContinuar();
    }
});

function cargarDatosPago() {
    const datosGuardados = localStorage.getItem('datosPago');

    if (!datosGuardados) {
        mostrarErrorPago();
        return;
    }

    try {
        datosPago = JSON.parse(datosGuardados);
        console.log('✅ Datos de pago cargados:', datosPago);
        mostrarContenidoPago();
        actualizarResumen();
    } catch (error) {
        console.error('❌ Error al parsear datos:', error);
        mostrarErrorPago();
    }
}

function mostrarErrorPago() {
    const pagoError = document.getElementById('pago-error');
    const pagoContenido = document.getElementById('pago-contenido');
    const resumenPedido = document.getElementById('resumen-pedido');

    if (pagoError) pagoError.style.display = 'block';
    if (pagoContenido) pagoContenido.style.display = 'none';
    if (resumenPedido) resumenPedido.style.display = 'none';
}

function mostrarContenidoPago() {
    const pagoError = document.getElementById('pago-error');
    const pagoContenido = document.getElementById('pago-contenido');
    const resumenPedido = document.getElementById('resumen-pedido');

    if (pagoError) pagoError.style.display = 'none';
    if (pagoContenido) pagoContenido.style.display = 'block';
    if (resumenPedido) resumenPedido.style.display = 'block';
}

function actualizarResumen() {
    const listaResumen = document.getElementById('lista-resumen');
    if (!listaResumen || !datosPago || !datosPago.carrito) return;

    listaResumen.innerHTML = '';

    datosPago.carrito.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'resumen-item';
        itemElement.innerHTML = `
            <span>${item.nombre} x${item.cantidad}</span>
            <span>$${formatearNumero(item.precio * item.cantidad)}</span>
        `;
        listaResumen.appendChild(itemElement);
    });

    const resumenSubtotal = document.getElementById('resumen-subtotal');
    const resumenEnvio = document.getElementById('resumen-envio');
    const resumenTotal = document.getElementById('resumen-total');

    if (resumenSubtotal) resumenSubtotal.textContent = `$${formatearNumero(datosPago.subtotal || 0)}`;
    if (resumenEnvio) resumenEnvio.textContent = `$${formatearNumero(datosPago.envio || 0)}`;
    if (resumenTotal) resumenTotal.textContent = `$${formatearNumero(datosPago.total || 0)}`;
}

// ==================== FUNCIÓN CORREGIDA: Siguiente Paso ====================
function siguientePaso() {
    console.log('🔽 Siguiente paso llamado, paso actual:', pasoActual);

    if (!verificarAutenticacion()) {
        return;
    }

    if (pasoActual === 1) {
        console.log('✅ Validando método de pago...');
        if (!validarMetodoPago()) {
            console.log('❌ Validación de método de pago falló');
            return;
        }

        // Si es efectivo, saltar directamente a confirmación
        if (metodoPagoSeleccionado === 'efectivo') {
            console.log('💰 Pago en efectivo - Saltando directamente a confirmación');
            mostrarResumenConfirmacion();
            mostrarSeccion('confirmacion');
            pasoActual = 3;
        } else {
            console.log('✅ Configurando secciones para:', metodoPagoSeleccionado);
            configurarSeccionesPorMetodoPago();
            console.log('✅ Mostrando sección información personal');
            mostrarSeccion('informacion-personal');
            pasoActual = 2;
        }

    } else if (pasoActual === 2) {
        console.log('✅ Validando datos del pago...');
        if (validarDatosPago()) {
            console.log('✅ Mostrando resumen de confirmación');
            mostrarResumenConfirmacion();
            mostrarSeccion('confirmacion');
            pasoActual = 3;
        } else {
            console.log('❌ Validación de datos del pago falló');
        }
    }
}

// ==================== NUEVA FUNCIÓN: Configurar secciones por método de pago ====================
function configurarSeccionesPorMetodoPago() {
    const seccionDatosBancarios = document.getElementById('seccion-datos-bancarios');
    const seccionComprobante = document.getElementById('seccion-comprobante');
    const seccionTarjeta = document.getElementById('seccion-tarjeta');
    const seccionEfectivoInfo = document.getElementById('seccion-efectivo-info');

    // Ocultar todas las secciones primero
    if (seccionDatosBancarios) seccionDatosBancarios.style.display = 'none';
    if (seccionComprobante) seccionComprobante.style.display = 'none';
    if (seccionTarjeta) seccionTarjeta.style.display = 'none';
    if (seccionEfectivoInfo) seccionEfectivoInfo.style.display = 'none';

    // Mostrar secciones según el método de pago
    if (metodoPagoSeleccionado === 'transferencia') {
        if (seccionDatosBancarios) seccionDatosBancarios.style.display = 'block';
        if (seccionComprobante) seccionComprobante.style.display = 'block';
        actualizarMontoTransferencia();
    } else if (metodoPagoSeleccionado === 'tarjeta') {
        if (seccionTarjeta) seccionTarjeta.style.display = 'block';
    }
    // Para efectivo no mostramos ninguna sección ya que va directo a confirmación
}

function anteriorPaso() {
    console.log('🔼 Anterior paso llamado, paso actual:', pasoActual);

    if (pasoActual === 2) {
        mostrarSeccion('metodo-pago');
        pasoActual = 1;
    } else if (pasoActual === 3) {
        // Si venimos de efectivo, volver al método de pago
        if (metodoPagoSeleccionado === 'efectivo') {
            mostrarSeccion('metodo-pago');
            pasoActual = 1;
        } else {
            mostrarSeccion('informacion-personal');
            pasoActual = 2;
        }
    }
}

function mostrarSeccion(seccion) {
    console.log('📋 Mostrando sección:', seccion);

    const seccionMetodoPago = document.getElementById('seccion-metodo-pago');
    const seccionInformacionPersonal = document.getElementById('seccion-informacion-personal');
    const seccionConfirmacion = document.getElementById('seccion-confirmacion');

    if (seccionMetodoPago) seccionMetodoPago.style.display = 'none';
    if (seccionInformacionPersonal) seccionInformacionPersonal.style.display = 'none';
    if (seccionConfirmacion) seccionConfirmacion.style.display = 'none';

    const seccionActual = document.getElementById(`seccion-${seccion}`);
    if (seccionActual) seccionActual.style.display = 'block';

    const paso1 = document.getElementById('paso1');
    const paso2 = document.getElementById('paso2');
    const paso3 = document.getElementById('paso3');

    if (paso1) paso1.classList.remove('activo', 'completado');
    if (paso2) paso2.classList.remove('activo', 'completado');
    if (paso3) paso3.classList.remove('activo', 'completado');

    if (seccion === 'metodo-pago') {
        if (paso1) paso1.classList.add('activo');
    } else if (seccion === 'informacion-personal') {
        if (paso1) paso1.classList.add('completado');
        if (paso2) paso2.classList.add('activo');
    } else if (seccion === 'confirmacion') {
        if (paso1) paso1.classList.add('completado');
        if (paso2) paso2.classList.add('completado');
        if (paso3) paso3.classList.add('activo');
    }
}

function validarMetodoPago() {
    console.log('🔍 Validando método de pago seleccionado:', metodoPagoSeleccionado);

    if (!metodoPagoSeleccionado) {
        alert('Por favor seleccioná un método de pago');
        return false;
    }
    return true;
}

// ==================== FUNCIÓN CORREGIDA: Validar Datos del Pago ====================
function validarDatosPago() {
    console.log('🔍 Validando datos del pago...');

    // Solo validamos según el método de pago seleccionado
    if (metodoPagoSeleccionado === 'tarjeta') {
        console.log('🔍 Validando datos de tarjeta...');

        const numeroTarjetaInput = document.getElementById('numero-tarjeta');
        const nombreTarjetaInput = document.getElementById('nombre-tarjeta');
        const mesVencimientoInput = document.getElementById('mes-vencimiento');
        const anoVencimientoInput = document.getElementById('ano-vencimiento');
        const cvvInput = document.getElementById('cvv-tarjeta');
        const dniTitularInput = document.getElementById('dni-titular');

        if (!numeroTarjetaInput || !nombreTarjetaInput || !mesVencimientoInput ||
            !anoVencimientoInput || !cvvInput || !dniTitularInput) {
            console.error('❌ No se encontraron los campos de tarjeta');
            alert('Error: No se pudieron cargar los campos de tarjeta. Por favor recargá la página.');
            return false;
        }

        const numeroTarjeta = numeroTarjetaInput.value.replace(/\s/g, '');
        const nombreTarjeta = nombreTarjetaInput.value.trim();
        const mesVencimiento = mesVencimientoInput.value;
        const anoVencimiento = anoVencimientoInput.value;
        const cvv = cvvInput.value.trim();
        const dniTitular = dniTitularInput.value.trim();

        // Validaciones básicas (sin algoritmo Luhn estricto)
        if (!numeroTarjeta) {
            alert('Por favor ingresá el número de tu tarjeta');
            numeroTarjetaInput.focus();
            return false;
        }

        if (numeroTarjeta.length < 13 || numeroTarjeta.length > 19) {
            alert('El número de tarjeta debe tener entre 13 y 19 dígitos');
            numeroTarjetaInput.focus();
            return false;
        }

        if (!/^\d+$/.test(numeroTarjeta)) {
            alert('El número de tarjeta solo puede contener dígitos');
            numeroTarjetaInput.focus();
            return false;
        }

        if (!nombreTarjeta) {
            alert('Por favor ingresá el nombre que figura en la tarjeta');
            nombreTarjetaInput.focus();
            return false;
        }

        if (!mesVencimiento) {
            alert('Por favor seleccioná el mes de vencimiento de tu tarjeta');
            mesVencimientoInput.focus();
            return false;
        }

        if (!anoVencimiento) {
            alert('Por favor seleccioná el año de vencimiento de tu tarjeta');
            anoVencimientoInput.focus();
            return false;
        }

        if (!validarFechaVencimiento(mesVencimiento, anoVencimiento)) {
            alert('La tarjeta está vencida');
            return false;
        }

        if (!cvv) {
            alert('Por favor ingresá el código de seguridad (CVV)');
            cvvInput.focus();
            return false;
        }

        if (cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
            alert('El código de seguridad (CVV) debe tener 3 o 4 dígitos numéricos');
            cvvInput.focus();
            return false;
        }

        if (!dniTitular) {
            alert('Por favor ingresá tu DNI');
            dniTitularInput.focus();
            return false;
        }

        if (!/^\d+$/.test(dniTitular)) {
            alert('El DNI debe contener solo números');
            dniTitularInput.focus();
            return false;
        }
    }

    // Validaciones para transferencia
    if (metodoPagoSeleccionado === 'transferencia') {
        console.log('🔍 Validando comprobante de transferencia...');

        const comprobanteInput = document.getElementById('comprobante');
        if (!comprobanteInput) {
            console.error('❌ No se encontró el campo de comprobante');
            alert('Error: No se pudo cargar el campo de comprobante. Por favor recargá la página.');
            return false;
        }

        const comprobante = comprobanteInput.files[0];
        if (!comprobante) {
            alert('Por favor adjuntá el comprobante de transferencia');
            return false;
        }

        if (comprobante.size > 5 * 1024 * 1024) {
            alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
            return false;
        }

        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!tiposPermitidos.includes(comprobante.type)) {
            alert('Formato de archivo no válido. Solo se permiten PDF, JPG y PNG.');
            return false;
        }

        archivoComprobante = comprobante;
    }

    // Para efectivo no hay validaciones adicionales
    console.log('✅ Todas las validaciones pasaron');
    return true;
}

function mostrarInfoArchivo() {
    const archivo = document.getElementById('comprobante').files[0];
    const infoArchivo = document.getElementById('info-archivo');

    if (archivo) {
        infoArchivo.innerHTML = `
            <strong>Archivo seleccionado:</strong> ${archivo.name}<br>
            <strong>Tamaño:</strong> ${formatearNumero(archivo.size / 1024 / 1024)} MB
        `;
    } else {
        infoArchivo.innerHTML = 'Formatos aceptados: PDF, JPG, PNG (máx. 5MB)';
    }
}

function copiarAlPortapapeles(elemento) {
    const texto = elemento.textContent;

    navigator.clipboard.writeText(texto).then(() => {
        const originalBackground = elemento.style.background;
        elemento.classList.add('copiado');
        elemento.textContent = '✓ Copiado!';

        setTimeout(() => {
            elemento.classList.remove('copiado');
            elemento.textContent = texto;
        }, 2000);

    }).catch(err => {
        console.error('Error al copiar: ', err);
        alert('No se pudo copiar al portapapeles. Por favor, copiá manualmente.');
    });
}

function mostrarModalExito(titulo, mensaje, icono = '✅') {
    const modalIcono = document.getElementById('modalIcono');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalMensaje = document.getElementById('modalMensaje');
    const modalExito = document.getElementById('modalExito');

    if (modalIcono && modalTitulo && modalMensaje && modalExito) {
        modalIcono.textContent = icono;
        modalTitulo.textContent = titulo;
        modalMensaje.innerHTML = mensaje;
        modalExito.style.display = 'flex';
    }
}

// ==================== NUEVA FUNCIÓN: Obtener datos reales del usuario desde la API ====================
async function obtenerDatosUsuarioReal() {
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        console.log('🔍 Obteniendo datos reales del usuario desde API...');

        const response = await fetch(`${window.API_BASE}/api/usuario/perfil`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener datos del usuario`);
        }

        const usuarioData = await response.json();
        console.log('✅ Datos reales del usuario obtenidos:', usuarioData);

        return usuarioData;

    } catch (error) {
        console.error('❌ Error al obtener datos del usuario:', error);

        // Fallback: intentar obtener datos básicos del token
        try {
            const token = obtenerToken();
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return {
                    nombreCompleto: payload[ClaimTypes.GivenName] || 'Cliente',
                    email: payload[ClaimTypes.Email] || 'cliente@ejemplo.com',
                    codigoPostal: 'Sin código postal',
                    telefono: 'Sin teléfono'
                };
            }
        } catch (fallbackError) {
            console.error('❌ Error en fallback:', fallbackError);
        }

        return {
            nombreCompleto: 'Cliente',
            email: 'cliente@ejemplo.com',
            codigoPostal: 'Sin código postal',
            telefono: 'Sin teléfono'
        };
    }
}

// ==================== FUNCIÓN PRINCIPAL DE PAGO ACTUALIZADA ====================
async function procesarPago() {
    const btnPagar = document.getElementById('btn-confirmar-pago');
    const textoOriginal = btnPagar.innerHTML;

    try {
        if (!verificarAutenticacion()) {
            return;
        }

        btnPagar.innerHTML = '<span class="loading"></span> Procesando...';
        btnPagar.disabled = true;

        // Obtener datos REALES del usuario desde la API
        const usuarioData = await obtenerDatosUsuarioReal();

        const pedidoData = {
            monto: datosPago.total,
            metodoPago: metodoPagoSeleccionado,
            clienteNombre: usuarioData.nombreCompleto,
            clienteEmail: usuarioData.email,
            clienteTelefono: usuarioData.telefono,
            clienteCodigoPostal: usuarioData.codigoPostal,
            carrito: datosPago.carrito,
            subtotal: datosPago.subtotal,
            envio: datosPago.envio,
            total: datosPago.total
        };

        if (metodoPagoSeleccionado === 'tarjeta') {
            const numeroTarjetaInput = document.getElementById('numero-tarjeta');
            const nombreTarjetaInput = document.getElementById('nombre-tarjeta');
            const mesVencimientoInput = document.getElementById('mes-vencimiento');
            const anoVencimientoInput = document.getElementById('ano-vencimiento');
            const dniTitularInput = document.getElementById('dni-titular');

            if (numeroTarjetaInput && nombreTarjetaInput && mesVencimientoInput && anoVencimientoInput && dniTitularInput) {
                pedidoData.datosTarjeta = {
                    ultimos4: numeroTarjetaInput.value.replace(/\s/g, '').slice(-4),
                    nombreTitular: nombreTarjetaInput.value,
                    vencimiento: mesVencimientoInput.value + '/' + anoVencimientoInput.value,
                    dniTitular: dniTitularInput.value
                };
            }
        } else if (metodoPagoSeleccionado === 'transferencia') {
            pedidoData.comprobante = archivoComprobante ? archivoComprobante.name : null;
        }

        console.log('📦 Enviando datos del pedido:', pedidoData);

        // Simular procesamiento de pago
        await new Promise(resolve => setTimeout(resolve, 2000));

        let idVentaGenerado = 'P' + Date.now();

        // Crear venta local
        idVentaGenerado = crearVentaLocal(pedidoData);

        if (metodoPagoSeleccionado === 'efectivo') {
            await procesarPagoEfectivo(pedidoData, idVentaGenerado);
        } else if (metodoPagoSeleccionado === 'transferencia') {
            await procesarPagoTransferencia(pedidoData, idVentaGenerado);
        } else if (metodoPagoSeleccionado === 'tarjeta') {
            await procesarPagoTarjeta(pedidoData, idVentaGenerado);
        }

        localStorage.removeItem('carrito');
        localStorage.removeItem('datosPago');

    } catch (error) {
        console.error('❌ Error al procesar el pedido:', error);
        alert('Error al procesar el pedido: ' + error.message);
        btnPagar.innerHTML = textoOriginal;
        btnPagar.disabled = false;
    }
}

function crearVentaLocal(pedidoData) {
    try {
        const ventasExistentes = JSON.parse(localStorage.getItem('ventas') || '[]');
        const contadorVentas = parseInt(localStorage.getItem('contadorVentas') || '1');
        const idVenta = `V-${contadorVentas.toString().padStart(5, '0')}`;

        const nuevaVenta = {
            id: idVenta,
            usuario: pedidoData.clienteEmail || 'Usuario Carrito',
            fecha: new Date().toISOString(),
            total: pedidoData.total,
            estado: 'pendiente',
            metodoPago: pedidoData.metodoPago || 'efectivo',
            productos: pedidoData.carrito || []
        };

        ventasExistentes.unshift(nuevaVenta);
        localStorage.setItem('ventas', JSON.stringify(ventasExistentes));
        localStorage.setItem('contadorVentas', (contadorVentas + 1).toString());

        console.log('✅ Venta local creada:', nuevaVenta);
        return idVenta;
    } catch (error) {
        console.error('❌ Error al crear venta local:', error);
        return 'P' + Date.now();
    }
}

// ==================== FUNCIONES DE PROCESAMIENTO ACTUALIZADAS ====================
async function procesarPagoEfectivo(pedidoData, idVenta) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mensaje = `
        <p><strong>Pedido #${idVenta}</strong></p>
        <p>Tu producto ha sido reservado en nuestro local.</p>
        <p><strong>IMPORTANTE:</strong> Tenés un plazo de <strong>7 días</strong> para retirarlo.</p>
        <p>Pasado este plazo, el producto volverá a estar disponible para la venta.</p>
        <p><strong>Dirección:</strong> Calle Principal 123, Centro, Santa Rosa</p>
        <p><strong>Horario:</strong> Lunes a Viernes 9:00-18:00, Sábados 9:00-13:00</p>
        <p><strong>📞 Teléfono:</strong> 2954-123456</p>
        <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px;">
            <strong>📋 Estado:</strong> <span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PENDIENTE</span> - Tu pedido será confirmado cuando retires el producto.
        </p>
    `;

    mostrarModalExito('✅ Producto Reservado', mensaje, '💰');
}

async function procesarPagoTransferencia(pedidoData, idVenta) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mensaje = `
        <p><strong>Pedido #${idVenta}</strong></p>
        <p>Tu comprobante de transferencia ha sido enviado exitosamente.</p>
        <p>Revisaremos el pago y te contactaremos para coordinar la entrega.</p>
        <p><strong>Email de confirmación:</strong> ivanechegaray888@gmail.com</p>
        <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px;">
            <strong>📋 Estado:</strong> <span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PENDIENTE</span> - El pedido se procesará una vez verifiquemos la transferencia.
        </p>
    `;

    mostrarModalExito('✅ Comprobante Enviado', mensaje, '🏦');
}

async function procesarPagoTarjeta(pedidoData, idVenta) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mensaje = `
        <p><strong>Pedido #${idVenta}</strong></p>
        <p>Tu pago con tarjeta ha sido procesado exitosamente.</p>
        <p>Te enviaremos un email con los detalles de tu compra y el tracking de envío.</p>
        <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px;">
            <strong>📋 Estado:</strong> <span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-weight: bold;">PENDIENTE</span> - Tu pedido será confirmado cuando sea despachado.
        </p>
    `;

    mostrarModalExito('✅ Pago Realizado', mensaje, '💳');
}

// ==================== FUNCIÓN CORREGIDA: Mostrar Resumen Confirmación ====================
async function mostrarResumenConfirmacion() {
    const resumen = document.getElementById('resumen-confirmacion');

    // Mostrar loading mientras se cargan los datos
    resumen.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading"></div>
            <p>Cargando datos del usuario...</p>
        </div>
    `;

    try {
        // Obtener datos REALES del usuario desde la API
        const usuarioData = await obtenerDatosUsuarioReal();

        const metodosPago = {
            'efectivo': 'Efectivo (Pago en el local)',
            'transferencia': 'Transferencia Bancaria',
            'tarjeta': 'Tarjeta de Crédito/Débito'
        };

        let detallesPago = '';
        let detallesEnvio = '';

        if (metodoPagoSeleccionado === 'efectivo') {
            detallesPago = `
                <div style="margin-top: 15px; padding: 12px; background: #fef9e7; border-radius: 6px; border-left: 4px solid #f39c12;">
                    <h4>💰 Pago en Efectivo</h4>
                    <p><strong>Modalidad:</strong> Retiro en el local</p>
                    <p><strong>Dirección:</strong> Calle Principal 123, Centro, Santa Rosa</p>
                    <p><strong>Horario:</strong> Lunes a Viernes 9:00-18:00, Sábados 9:00-13:00</p>
                    <p><strong>Teléfono:</strong> 2954-123456</p>
                </div>
            `;
            detallesEnvio = `
                <div style="margin-bottom: 20px;">
                    <h3>Retiro en Local</h3>
                    <p><strong>Modalidad:</strong> Retirás personalmente en nuestro local</p>
                    <p><strong>Dirección:</strong> Calle Principal 123, Centro, Santa Rosa</p>
                    <p><strong>Horario:</strong> Lunes a Viernes 9:00-18:00, Sábados 9:00-13:00</p>
                </div>
            `;
        } else if (metodoPagoSeleccionado === 'tarjeta') {
            const numeroTarjetaInput = document.getElementById('numero-tarjeta');
            const nombreTarjetaInput = document.getElementById('nombre-tarjeta');
            const mesVencimientoInput = document.getElementById('mes-vencimiento');
            const anoVencimientoInput = document.getElementById('ano-vencimiento');
            const dniTitularInput = document.getElementById('dni-titular');

            if (numeroTarjetaInput && nombreTarjetaInput && mesVencimientoInput && anoVencimientoInput && dniTitularInput) {
                const ultimos4 = numeroTarjetaInput.value.replace(/\s/g, '').slice(-4);
                detallesPago = `
                    <div style="margin-top: 15px; padding: 12px; background: #e8f4fd; border-radius: 6px; border-left: 4px solid #3498db;">
                        <h4>💳 Datos de Pago con Tarjeta</h4>
                        <p><strong>Tarjeta:</strong> •••• ${ultimos4}</p>
                        <p><strong>Titular:</strong> ${nombreTarjetaInput.value}</p>
                        <p><strong>Vencimiento:</strong> ${mesVencimientoInput.value}/${anoVencimientoInput.value}</p>
                        <p><strong>DNI Titular:</strong> ${dniTitularInput.value}</p>
                    </div>
                `;
            }
            detallesEnvio = `
                <div style="margin-bottom: 20px;">
                    <h3>Envío a Domicilio</h3>
                    <p>Tu pedido será enviado a la dirección registrada en tu cuenta.</p>
                    <p><strong>Código Postal:</strong> ${usuarioData.codigoPostal || 'No especificado'}</p>
                </div>
            `;
        } else if (metodoPagoSeleccionado === 'transferencia') {
            detallesPago = `
                <div style="margin-top: 15px; padding: 12px; background: #f4ecf7; border-radius: 6px; border-left: 4px solid #9b59b6;">
                    <h4>🏦 Datos para Transferencia</h4>
                    <p><strong>CBU/Alias:</strong> Disponibles en el paso anterior</p>
                    <p><strong>Monto a transferir:</strong> $${formatearNumero(datosPago.total || 0)}</p>
                    <p><strong>Comprobante:</strong> ${archivoComprobante ? 'Adjuntado ✓' : 'Pendiente'}</p>
                </div>
            `;
            detallesEnvio = `
                <div style="margin-bottom: 20px;">
                    <h3>Envío a Domicilio</h3>
                    <p>Tu pedido será enviado a la dirección registrada en tu cuenta.</p>
                    <p><strong>Código Postal:</strong> ${usuarioData.codigoPostal || 'No especificado'}</p>
                </div>
            `;
        }

        resumen.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3>📋 Información de Contacto</h3>
                <p><strong>Nombre Completo:</strong> ${usuarioData.nombreCompleto}</p>
                <p><strong>Email:</strong> ${usuarioData.email}</p>
                <p><strong>Teléfono:</strong> ${usuarioData.telefono || 'No especificado'}</p>
                <p><strong>Código Postal:</strong> ${usuarioData.codigoPostal || 'No especificado'}</p>
            </div>

            ${detallesEnvio}

            <div>
                <h3>💳 Método de Pago</h3>
                <p><strong>${metodosPago[metodoPagoSeleccionado]}</strong></p>
                ${detallesPago}
            </div>
        `;

    } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        resumen.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <p>❌ Error al cargar los datos del usuario</p>
                <p>Por favor, recargá la página e intentá nuevamente.</p>
            </div>
        `;
    }
}

async function procesarPagoFinal() {
    console.log('🚀 Iniciando procesamiento de pago final...');
    await procesarPago();
}

// Constantes para ClaimTypes (si no están definidas globalmente)
const ClaimTypes = {
    NameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    Email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    Name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
    GivenName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    Role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
};