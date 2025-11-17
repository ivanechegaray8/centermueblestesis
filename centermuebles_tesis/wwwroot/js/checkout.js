// ==================== SISTEMA DE COMPRAS ====================
async function procesarCompra(metodoPago = 'Efectivo') {
    if (!usuarioLogueado) {
        mostrarNotificacion('🔐 Debes iniciar sesión para comprar', 'error');
        mostrarLogin();
        return false;
    }

    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        mostrarNotificacion('🛒 El carrito está vacío', 'error');
        return false;
    }

    const compraData = {
        Items: carrito.map(item => ({
            IdProducto: item.id,
            Cantidad: item.cantidad
        })),
        MetodoPago: metodoPago
    };

    try {
        mostrarNotificacion('⏳ Procesando compra...', 'info');

        const response = await fetch(`${API_VENTAS}/procesarcompra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(compraData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al procesar la compra');
        }

        localStorage.removeItem('carrito');
        actualizarContadorCarrito();
        mostrarNotificacion('✅ ¡Compra realizada exitosamente!', 'success');

        setTimeout(() => {
            window.location.href = 'miscompras.html';
        }, 2000);

        return true;

    } catch (error) {
        console.error('Error en compra:', error);
        mostrarNotificacion(`❌ ${error.message}`, 'error');
        return false;
    }
}

// FUNCIÓN: Procesar compra confirmada desde el carrito
async function procesarCompraConfirmada() {
    const btnComprar = document.querySelector('.btn-confirmar');
    const textoOriginal = btnComprar ? btnComprar.innerHTML : 'Confirmar Compra';

    try {
        if (btnComprar) {
            btnComprar.innerHTML = '<span class="loading-spinner"></span> Procesando...';
            btnComprar.disabled = true;
        }

        // Verificar autenticación
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) {
            mostrarNotificacion('🔐 Debes iniciar sesión para comprar', 'error');
            // Guardar flag para mostrar login automático
            localStorage.setItem('mostrarLoginAutomatico', 'true');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        // Validar que el carrito no esté vacío
        const carrito = obtenerCarrito();
        if (carrito.length === 0) {
            throw new Error('El carrito está vacío');
        }

        // Validar stock antes de proceder al pago
        const validacionStock = await validarStockCarrito();
        if (!validacionStock.stockSuficiente) {
            const errores = validacionStock.validaciones?.filter(v => !v.stockSuficiente) || [];
            const mensajeError = errores.map(e =>
                `${e.NombreProducto}: Stock ${e.StockDisponible}, solicitado ${e.CantidadSolicitada}`
            ).join('\n');
            throw new Error(`Stock insuficiente:\n${mensajeError}`);
        }

        // Preparar datos para la página de pago
        await prepararDatosParaPago();

        console.log('✅ Redireccionando a pago.html...');
        // REDIRECCIÓN DIRECTA A PAGO.HTML
        window.location.href = 'pago.html';

    } catch (error) {
        console.error('Error al preparar pago:', error);
        mostrarNotificacion(`❌ ${error.message}`, 'error');

        // Restaurar el botón
        if (btnComprar) {
            btnComprar.innerHTML = textoOriginal;
            btnComprar.disabled = false;
        }
    }
}

// FUNCIÓN: Preparar datos para la página de pago
async function prepararDatosParaPago() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        throw new Error('El carrito está vacío');
    }

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envio = subtotal > 0 ? 1500 : 0; // $1500 de envío
    const total = subtotal + envio;

    // Preparar datos para la página de pago
    const datosPago = {
        carrito: carrito,
        subtotal: subtotal,
        envio: envio,
        total: total,
        timestamp: new Date().getTime(),
        usuario: JSON.parse(localStorage.getItem('usuario'))
    };

    // Guardar datos en localStorage para la página de pago
    localStorage.setItem('datosPago', JSON.stringify(datosPago));
    console.log('✅ Datos de pago preparados y guardados:', datosPago);

    return datosPago;
}

async function validarStockCarrito() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        return { stockSuficiente: false, errores: ['El carrito está vacío'] };
    }

    try {
        const response = await fetch(`${API_VENTAS}/validarstock`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carrito.map(item => ({
                IdProducto: item.id,
                Cantidad: item.cantidad
            })))
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error validando stock:', error);
        return { stockSuficiente: false, errores: ['Error al validar stock'] };
    }
}

// FUNCIÓN MODIFICADA: Ahora redirecciona a pago.html
function mostrarConfirmacionCompra() {
    if (!usuarioLogueado) {
        mostrarNotificacion('🔐 Debes iniciar sesión para comprar', 'error');
        mostrarLogin();
        return;
    }

    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        mostrarNotificacion('🛒 El carrito está vacío', 'error');
        return;
    }

    // En lugar de mostrar modal, redireccionar directamente a pago.html
    procesarCompraConfirmada();
}