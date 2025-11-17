// ==================== CARRITO.JS CORREGIDO ====================
// Usar IIFE para evitar conflictos de variables
(function () {
    'use strict';

    // Configuración dentro del scope local
    const API_BASE = 'http://localhost:5269';
    const API_PRODUCTOS = `${API_BASE}/api/productos`;
    const API_VENTAS = `${API_BASE}/api/ventas`;

    // Variables globales para esta página
    let productosGlobales = [];

    // ==================== FUNCIÓN PARA FORMATEAR PRECIOS ====================
    function formatearPrecio(precio) {
        if (typeof precio !== 'number') {
            precio = parseFloat(precio) || 0;
        }

        // Separar parte entera y decimal
        const partes = precio.toFixed(2).split('.');
        const parteEntera = partes[0];
        const parteDecimal = partes[1];

        // Formatear parte entera con puntos para miles
        const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // Retornar el precio formateado
        return `$${parteEnteraFormateada},${parteDecimal}`;
    }

    // ==================== FUNCIONES DEL CARRITO ====================

    // Inicialización específica para la página del carrito
    document.addEventListener('DOMContentLoaded', async function () {
        console.log('🛒 Inicializando página del carrito...');

        // Cargar productos para validar stock
        await cargarProductos();
        actualizarVistaCarrito();

        // Asignar evento al botón de comprar
        const btnComprar = document.getElementById('btn-comprar');
        if (btnComprar) {
            btnComprar.addEventListener('click', procesarCompraConfirmada);
        }
    });

    async function cargarProductos() {
        try {
            const response = await fetch(API_PRODUCTOS);
            if (response.ok) {
                productosGlobales = await response.json();
                console.log('✅ Productos cargados para validación de stock:', productosGlobales.length);
            }
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
        }
    }

    function obtenerStockDisponible(productoId) {
        // Buscar por idProducto o id (compatibilidad)
        const producto = productosGlobales.find(p =>
            p.idProducto === productoId || p.id === productoId
        );
        return producto ? producto.stock : 0;
    }

    function obtenerCarrito() {
        try {
            const carritoGuardado = localStorage.getItem('carrito');
            return carritoGuardado ? JSON.parse(carritoGuardado) : [];
        } catch (error) {
            console.error('❌ Error al obtener carrito:', error);
            return [];
        }
    }

    function guardarCarrito(carrito) {
        try {
            localStorage.setItem('carrito', JSON.stringify(carrito));
        } catch (error) {
            console.error('❌ Error al guardar carrito:', error);
        }
    }

    function actualizarVistaCarrito() {
        const carrito = obtenerCarrito();
        const carritoVacio = document.getElementById('carrito-vacio');
        const carritoContenido = document.getElementById('carrito-contenido');
        const listaCarrito = document.getElementById('lista-carrito');
        const btnComprar = document.getElementById('btn-comprar');
        const alertaStock = document.getElementById('alerta-stock');

        console.log('🛒 Carrito actual:', carrito);

        if (carrito.length === 0) {
            if (carritoVacio) carritoVacio.style.display = 'block';
            if (carritoContenido) carritoContenido.style.display = 'none';
            if (alertaStock) alertaStock.style.display = 'none';
            if (btnComprar) btnComprar.disabled = true;
            return;
        }

        if (carritoVacio) carritoVacio.style.display = 'none';
        if (carritoContenido) carritoContenido.style.display = 'block';
        if (btnComprar) btnComprar.disabled = false;

        // Limpiar lista
        if (listaCarrito) {
            listaCarrito.innerHTML = '';
        } else {
            console.log('❌ lista-carrito no encontrado');
            return;
        }

        let subtotal = 0;
        let hayProblemasStock = false;

        carrito.forEach((item, index) => {
            const stockDisponible = obtenerStockDisponible(item.id);
            const itemTotal = item.precio * item.cantidad;
            subtotal += itemTotal;

            // Verificar si hay problemas de stock
            if (item.cantidad > stockDisponible) {
                hayProblemasStock = true;
            }

            const carritoItem = document.createElement('div');
            carritoItem.className = 'carrito-item';
            carritoItem.innerHTML = `
                <div class="carrito-item-imagen">
                    ${item.imagen && item.imagen !== 'undefined' ?
                    `<img src="${item.imagen}" alt="${item.nombre}" onerror="this.style.display='none'">` :
                    '<div>📷</div>'
                }
                </div>
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-precio">${formatearPrecio(item.precio)}</div>
                    <div class="carrito-item-stock">Stock disponible: ${stockDisponible}</div>
                    ${item.cantidad > stockDisponible ?
                    `<div class="stock-alerta">❌ Excedes el stock disponible</div>` :
                    ''
                }
                </div>
                <div class="carrito-item-controls">
                    <div class="cantidad-control">
                        <button class="btn-cantidad" onclick="carritoManager.cambiarCantidad(${index}, -1)" ${item.cantidad <= 1 ? 'disabled' : ''}>-</button>
                        <span class="cantidad">${item.cantidad}</span>
                        <button class="btn-cantidad" onclick="carritoManager.cambiarCantidad(${index}, 1)" ${item.cantidad >= stockDisponible ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="precio-subtotal">${formatearPrecio(itemTotal)}</div>
                    <button class="btn-eliminar-item" onclick="carritoManager.eliminarDelCarrito(${index})">
                        🗑️ Eliminar
                    </button>
                </div>
            `;
            listaCarrito.appendChild(carritoItem);
        });

        // Mostrar/ocultar alerta de stock
        if (alertaStock) {
            alertaStock.style.display = hayProblemasStock ? 'block' : 'none';
        }

        // Deshabilitar botón de compra si hay problemas de stock
        if (btnComprar) {
            btnComprar.disabled = hayProblemasStock;
        }

        // Actualizar resumen con precios formateados
        const envio = subtotal > 0 ? 1500 : 0; // Ejemplo: $1500 de envío
        const total = subtotal + envio;

        const subtotalElement = document.getElementById('subtotal');
        const envioElement = document.getElementById('envio');
        const totalElement = document.getElementById('total');

        if (subtotalElement) subtotalElement.textContent = formatearPrecio(subtotal);
        if (envioElement) envioElement.textContent = formatearPrecio(envio);
        if (totalElement) totalElement.textContent = formatearPrecio(total);
    }

    function cambiarCantidad(index, cambio) {
        const carrito = obtenerCarrito();
        if (carrito[index]) {
            const stockDisponible = obtenerStockDisponible(carrito[index].id);
            const nuevaCantidad = carrito[index].cantidad + cambio;

            // Validar que no exceda el stock
            if (nuevaCantidad > stockDisponible) {
                mostrarNotificacion(`❌ No puedes agregar más de ${stockDisponible} unidades`, 'error');
                return;
            }

            if (nuevaCantidad <= 0) {
                carrito.splice(index, 1);
                mostrarNotificacion('🗑️ Producto eliminado', 'info');
            } else {
                carrito[index].cantidad = nuevaCantidad;
            }

            guardarCarrito(carrito);
            actualizarVistaCarrito();
        }
    }

    function eliminarDelCarrito(index) {
        const carrito = obtenerCarrito();
        const productoEliminado = carrito[index];
        carrito.splice(index, 1);
        guardarCarrito(carrito);
        actualizarVistaCarrito();
        mostrarNotificacion(`🗑️ ${productoEliminado.nombre} eliminado`, 'info');
    }

    // FUNCIÓN CORREGIDA: Maneja correctamente la redirección
    async function procesarCompraConfirmada() {
        const btnComprar = document.getElementById('btn-comprar');
        if (!btnComprar) {
            console.error('❌ Botón de compra no encontrado');
            return;
        }

        const textoOriginal = btnComprar.innerHTML;

        try {
            btnComprar.innerHTML = '<span class="loading"></span> Preparando pago...';
            btnComprar.disabled = true;

            // Verificar autenticación PRIMERO
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (!usuario) {
                mostrarNotificacion('🔐 Debes iniciar sesión para comprar', 'error');

                // GUARDAR FLAG ESPECÍFICO - ESTA ES LA LÍNEA CLAVE
                localStorage.setItem('mostrarLoginAutomatico', 'true');
                console.log('🚩 Flag mostrarLoginAutomatico guardado');

                // Redireccionar a index.html después de un breve delay
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
            btnComprar.innerHTML = textoOriginal;
            btnComprar.disabled = false;
        }
    }

    // FUNCIÓN PARA PREPARAR DATOS PARA PAGO
    async function prepararDatosParaPago() {
        const carrito = obtenerCarrito();

        if (carrito.length === 0) {
            throw new Error('El carrito está vacío');
        }

        // Calcular totales
        const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const envio = subtotal > 0 ? 1500 : 0;
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

            if (!response.ok) {
                throw new Error('Error en la validación de stock');
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error validando stock:', error);
            return { stockSuficiente: false, errores: ['Error al validar stock'] };
        }
    }

    // Sistema de notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const tipos = {
            success: { bg: '#27ae60', icon: '✅' },
            error: { bg: '#e74c3c', icon: '❌' },
            info: { bg: '#3498db', icon: 'ℹ️' },
            warning: { bg: '#f39c12', icon: '⚠️' }
        };

        const config = tipos[tipo] || tipos.info;

        // Eliminar notificación anterior si existe
        const notificacionExistente = document.querySelector('.notificacion-global');
        if (notificacionExistente) {
            notificacionExistente.remove();
        }

        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-global';
        notificacion.innerHTML = `${config.icon} ${mensaje}`;
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${config.bg};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
            font-weight: 500;
            max-width: 400px;
            word-wrap: break-word;
        `;

        document.body.appendChild(notificacion);

        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notificacion.parentNode) {
                        notificacion.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    // Agregar estilos para animaciones
    if (!document.querySelector('#carrito-styles')) {
        const style = document.createElement('style');
        style.id = 'carrito-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }

            .btn-primary {
                background: #3498db;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                display: inline-block;
            }

            .loading {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .precio-subtotal {
                font-weight: bold;
                color: #2c3e50;
                min-width: 120px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    // Crear objeto global para acceder a las funciones desde HTML
    window.carritoManager = {
        cambiarCantidad: cambiarCantidad,
        eliminarDelCarrito: eliminarDelCarrito,
        obtenerCarrito: obtenerCarrito,
        actualizarVistaCarrito: actualizarVistaCarrito,
        procesarCompraConfirmada: procesarCompraConfirmada
    };

})();