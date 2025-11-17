// ventas.js
class SistemaVentas {
    constructor() {
        this.ventas = [];
        this.ventaSeleccionada = null;
        this.esAdministrador = true;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Inicializando sistema de ventas...');
            await this.verificarAutenticacion();
            console.log('✅ Autenticación verificada');

            await this.cargarVentas();
            console.log('✅ Ventas cargadas');

            this.setupEventListeners();
            console.log('✅ Event listeners configurados');

            this.establecerLimitesFecha();
            console.log('✅ Límites de fecha establecidos');

            console.log('🎉 Sistema inicializado correctamente');
        } catch (error) {
            console.error('❌ Error en init():', error);
        }
    }

    establecerLimitesFecha() {
        const fechaInput = document.getElementById('filtroFecha');
        if (fechaInput) {
            fechaInput.min = '2025-10-01';
            fechaInput.max = '2029-12-31';
        }
    }

    async verificarAutenticacion() {
        const token = this.obtenerToken();
        if (!token) {
            alert('Debes iniciar sesión como administrador');
            window.location.href = 'index.html';
            return;
        }
        this.esAdministrador = true;
        this.mostrarInterfazSegunRol();
    }

    mostrarInterfazSegunRol() {
        document.getElementById('panelAdmin').classList.remove('hidden');
        document.getElementById('columnaUsuario').style.display = 'table-cell';
        document.querySelectorAll('.btn-admin').forEach(btn => {
            btn.style.display = 'inline-block';
        });
        document.getElementById('panelCliente').classList.add('hidden');
    }

    obtenerToken() {
        return localStorage.getItem('jwtToken') || localStorage.getItem('token');
    }

    async hacerPeticion(url, opciones = {}) {
        const token = this.obtenerToken();
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            ...opciones
        };

        console.log('Haciendo petición a:', url);

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('token');
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                window.location.href = 'index.html';
                throw new Error('No autorizado');
            }

            if (response.status === 403) {
                throw new Error('No tienes permisos de administrador');
            }

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            console.error('Error en fetch:', error);
            throw error;
        }
    }

    async cargarVentas() {
        try {
            const cuerpoTabla = document.getElementById('cuerpoTablaVentas');
            cuerpoTabla.innerHTML = '<tr><td colspan="8" class="loading">Cargando ventas...</td></tr>';

            console.log('🔄 Cargando ventas desde: /api/Ventas');
            const response = await this.hacerPeticion('/api/Ventas');

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const ventasAPI = await response.json();

            // Transformar datos de la API - VERSIÓN UNIVERSAL
            this.ventas = ventasAPI.map(venta => {
                let usuarioInfo = {
                    email: 'N/A',
                    nombreCompleto: 'Cliente',
                    telefono: 'No disponible',
                    direccion: 'No disponible',
                    codigoPostal: 'No disponible'
                };

                // 🔍 BUSCAR USUARIO EN TODAS LAS POSIBLES UBICACIONES
                let usuarioEncontrado = null;

                // Intentar todas las posibles ubicaciones del usuario
                if (venta.Usuario) usuarioEncontrado = venta.Usuario;
                else if (venta.usuario) usuarioEncontrado = venta.usuario;
                else if (venta.IdUsuarioNavigation) usuarioEncontrado = venta.IdUsuarioNavigation;
                else if (venta.cliente) usuarioEncontrado = venta.cliente;
                else if (venta.Cliente) usuarioEncontrado = venta.Cliente;

                if (usuarioEncontrado) {
                    console.log('✅ USUARIO ENCONTRADO en venta:', venta.IdVenta || venta.idVenta);

                    // Extraer datos del usuario encontrado
                    usuarioInfo = {
                        email: usuarioEncontrado.email || usuarioEncontrado.Email || 'N/A',
                        nombreCompleto: usuarioEncontrado.nombreCompleto || usuarioEncontrado.NombreCompleto || 'Cliente',
                        telefono: usuarioEncontrado.telefono || usuarioEncontrado.Telefono || 'No disponible',
                        direccion: usuarioEncontrado.direccion || usuarioEncontrado.Direccion || 'No disponible',
                        codigoPostal: usuarioEncontrado.codigoPostal || usuarioEncontrado.CodigoPostal || 'No disponible'
                    };
                }

                // Determinar estado
                let estadoVenta;
                const estadoDesdeAPI = venta.Estado || venta.estado || venta.EstadoVenta || venta.estadoVenta;

                if (estadoDesdeAPI && estadoDesdeAPI.trim() !== '') {
                    estadoVenta = estadoDesdeAPI.toLowerCase();
                } else {
                    estadoVenta = 'pendiente';
                }

                // ✅ CORRECCIÓN: Manejar productos de forma más robusta
                let productos = [];
                if (venta.Productos && Array.isArray(venta.Productos) && venta.Productos.length > 0) {
                    productos = venta.Productos;
                } else if (venta.productos && Array.isArray(venta.productos) && venta.productos.length > 0) {
                    productos = venta.productos;
                } else if (venta.DetalleVentas && Array.isArray(venta.DetalleVentas) && venta.DetalleVentas.length > 0) {
                    productos = venta.DetalleVentas;
                }

                console.log(`📦 Venta ${venta.IdVenta}: ${productos.length} productos encontrados`);

                const ventaTransformada = {
                    id: venta.IdVenta?.toString() || venta.idVenta?.toString() || 'N/A',
                    usuario: usuarioInfo,
                    fecha: venta.FechaVenta || venta.fechaVenta || new Date().toISOString(),
                    total: venta.Total || venta.total || venta.TotalVenta || venta.totalVenta || 0,
                    estado: estadoVenta,
                    metodoPago: (venta.MetodoPago || venta.metodoPago || 'efectivo').toLowerCase(),
                    productos: productos.map(p => ({
                        id: p.IdProducto || p.idProducto,
                        nombre: p.Nombre || p.nombre,
                        cantidad: p.Cantidad || p.cantidad || 1,
                        precio: p.PrecioUnitario || p.precioUnitario || 0,
                        stock: p.Stock !== undefined ? p.Stock : 'N/A',
                        subTotal: p.SubTotal || p.subTotal || 0
                    }))
                };

                return ventaTransformada;
            });

            console.log(`✅ ${this.ventas.length} ventas transformadas`);

            // PRIMERO mostrar las ventas en la tabla
            this.mostrarVentas();

            // LUEGO actualizar el dashboard
            setTimeout(() => {
                console.log('🔄 Actualizando dashboard después de cargar ventas...');
                this.actualizarDashboard();
            }, 100);

        } catch (error) {
            console.error('Error al cargar ventas:', error);
            const cuerpoTabla = document.getElementById('cuerpoTablaVentas');
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--danger-color); padding: 40px;">
                        <strong>Error al cargar ventas</strong><br>
                        <small>${error.message}</small><br>
                        <p style="font-size: 12px; margin: 10px 0;">
                        Endpoint utilizado: /api/Ventas<br>
                        Asegúrate de estar autenticado como administrador
                        </p>
                        <button class="btn btn-primary" onclick="cargarVentas()">Reintentar</button>
                        <button class="btn btn-secondary" onclick="volverATienda()">Volver a Tienda</button>
                    </td>
                </tr>
            `;
        }
    }

    // ✅ FUNCIÓN AGREGADA: Actualizar dashboard con datos de API
    actualizarDashboardConEstadisticas(estadisticas) {
        console.log('✅ [DASHBOARD] Actualizando con datos de API:', estadisticas);

        // ✅ CORRECCIÓN: Manejar estructura de estadísticas
        const totalVentas = estadisticas.TotalVentas || estadisticas.totalVentas || 0;
        const ventasHoy = estadisticas.VentasHoy || estadisticas.ventasHoy || { Total: 0, Transacciones: 0 };
        const ventasPendientes = estadisticas.VentasPendientes || estadisticas.ventasPendientes || 0;
        const productosVendidos = estadisticas.ProductosVendidos || estadisticas.productosVendidos || 0;

        document.getElementById('totalVentas').textContent = this.formatearPrecio(totalVentas);
        document.getElementById('ventasHoy').textContent = this.formatearPrecio(ventasHoy.Total || ventasHoy.total || 0);
        document.getElementById('transaccionesHoy').textContent = `${ventasHoy.Transacciones || ventasHoy.transacciones || 0} transacciones`;
        document.getElementById('ventasPendientes').textContent = ventasPendientes;
        document.getElementById('productosVendidos').textContent = productosVendidos;
    }

    async actualizarDashboard() {
        try {
            console.log('🔄 [DASHBOARD] Iniciando actualización...');
            console.log('📊 [DASHBOARD] Ventas en memoria:', this.ventas.length);

            const response = await this.hacerPeticion('/api/Ventas/estadisticas');

            if (response.ok) {
                const estadisticas = await response.json();
                console.log('✅ [DASHBOARD] Datos de API:', estadisticas);
                this.actualizarDashboardConEstadisticas(estadisticas);
            } else {
                console.log('ℹ️ [DASHBOARD] API no disponible, calculando localmente');
                this.calcularEstadisticasLocales();
            }
        } catch (error) {
            console.log('⚠️ [DASHBOARD] Error, calculando localmente:', error);
            this.calcularEstadisticasLocales();
        }
    }

    calcularEstadisticasLocales() {
        try {
            console.log('🔄 [CÁLCULO] Iniciando cálculo local...');
            console.log('📊 [CÁLCULO] Ventas para procesar:', this.ventas.length);

            const hoy = new Date();
            const hoyISO = hoy.toISOString().split('T')[0];
            const mesActual = hoy.getMonth();
            const añoActual = hoy.getFullYear();

            console.log('📅 [CÁLCULO] Fecha hoy:', hoyISO);

            let totalVentas = 0;
            let totalHoy = 0;
            let transaccionesHoy = 0;
            let ventasPendientes = 0;
            let productosVendidos = 0;

            // Procesar cada venta
            this.ventas.forEach((venta, index) => {
                try {
                    const estado = venta.estado?.toLowerCase();
                    const fechaVenta = new Date(venta.fecha);
                    const fechaVentaISO = fechaVenta.toISOString().split('T')[0];
                    const total = Number(venta.total) || 0;

                    // ✅ VENTAS COMPLETADAS DEL MES (para Total Ventas)
                    if (estado === 'completada') {
                        if (fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual) {
                            totalVentas += total;

                            // Productos vendidos (solo completadas del mes)
                            if (venta.productos && Array.isArray(venta.productos)) {
                                venta.productos.forEach(producto => {
                                    productosVendidos += Number(producto.cantidad) || 0;
                                });
                            }
                        }

                        // ✅ VENTAS DE HOY (SOLO COMPLETADAS)
                        if (fechaVentaISO === hoyISO) {
                            totalHoy += total;
                            transaccionesHoy++;
                            console.log(`✅ Venta ${index} de hoy: ${venta.id} - ${this.formatearPrecio(total)}`);
                        }
                    }

                    // Ventas pendientes (solo para el contador de pendientes)
                    if (estado === 'pendiente') {
                        ventasPendientes++;
                    }

                } catch (error) {
                    console.warn(`⚠️ Error procesando venta ${venta.id}:`, error);
                }
            });

            // ✅ AHORA SÍ totalHoy está DEFINIDO
            console.log('💰 [CÁLCULO] Resultado - Ventas Hoy:', this.formatearPrecio(totalHoy));
            console.log('📈 [CÁLCULO] RESULTADOS:', {
                totalVentas: this.formatearPrecio(totalVentas),
                totalHoy: this.formatearPrecio(totalHoy),
                transaccionesHoy: transaccionesHoy,
                ventasPendientes: ventasPendientes,
                productosVendidos: productosVendidos
            });

            // ACTUALIZAR INTERFAZ
            document.getElementById('totalVentas').textContent = this.formatearPrecio(totalVentas);
            document.getElementById('ventasHoy').textContent = this.formatearPrecio(totalHoy);
            document.getElementById('transaccionesHoy').textContent = `${transaccionesHoy} transacciones`;
            document.getElementById('ventasPendientes').textContent = ventasPendientes;
            document.getElementById('productosVendidos').textContent = productosVendidos;

            // 🔥 GUARDAR EN HISTÓRICO
            this.guardarHistoricoVentasHoy(totalHoy, transaccionesHoy);

            console.log('✅ [CÁLCULO] Dashboard actualizado correctamente');

        } catch (error) {
            console.error('❌ [CÁLCULO] Error:', error);
        }
    }

    guardarHistoricoVentasHoy(totalHoy, transaccionesHoy) {
        try {
            const hoy = new Date().toISOString().split('T')[0];
            const historico = JSON.parse(localStorage.getItem('historicoVentas') || '{}');

            historico[hoy] = {
                total: totalHoy,
                transacciones: transaccionesHoy,
                fecha: new Date().toLocaleString()
            };

            localStorage.setItem('historicoVentas', JSON.stringify(historico));
            console.log('💾 Histórico guardado para:', hoy);
        } catch (error) {
            console.error('Error guardando histórico:', error);
        }
    }

    mostrarVentas(ventasFiltradas = null) {
        const cuerpoTabla = document.getElementById('cuerpoTablaVentas');
        const ventasAMostrar = ventasFiltradas || this.ventas;

        if (!ventasAMostrar || ventasAMostrar.length === 0) {
            cuerpoTabla.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No se encontraron ventas</td></tr>';
            return;
        }

        ventasAMostrar.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        cuerpoTabla.innerHTML = '';
        ventasAMostrar.forEach(venta => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>#${venta.id}</strong></td>
                <td>${venta.usuario.email}</td>
                <td>${this.formatearFecha(venta.fecha)}</td>
                <td><strong>${this.formatearPrecio(venta.total)}</strong></td>
                <td><span class="estado ${venta.estado}">${this.capitalizeFirstLetter(venta.estado)}</span></td>
                <td><span class="metodo-pago">${this.capitalizeFirstLetter(venta.metodoPago)}</span></td>
                <td>${venta.productos ? venta.productos.length : 0} producto(s)</td>
                <td class="actions-cell">
                    <button class="btn btn-primary btn-sm" onclick="sistemaVentas.verDetallesAsync('${venta.id}')">Ver</button>
                    <button class="btn btn-warning btn-sm btn-admin" onclick="sistemaVentas.cambiarEstado('${venta.id}')">Estado</button>
                </td>
            `;
            cuerpoTabla.appendChild(fila);
        });
    }

    setupEventListeners() {
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', e => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        document.getElementById('btnBuscar').addEventListener('click', () => this.buscarVentas());
        document.getElementById('buscarVenta').addEventListener('keyup', e => {
            if (e.key === 'Enter') this.buscarVentas();
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', e => {
                if (e.target === modal) modal.style.display = 'none';
            });
        });
    }

    buscarVentas() {
        const texto = document.getElementById('buscarVenta').value.toLowerCase().trim();
        if (!texto) {
            this.mostrarVentas();
            return;
        }

        const ventasFiltradas = this.ventas.filter(venta =>
            venta.id.toLowerCase().includes(texto) ||
            venta.usuario.email.toLowerCase().includes(texto)
        );

        this.mostrarVentas(ventasFiltradas);
    }

    aplicarFiltros() {
        const estado = document.getElementById('filtroEstado').value;
        const metodoPago = document.getElementById('filtroMetodoPago').value;
        const fechaInput = document.getElementById('filtroFecha').value;

        let ventasFiltradas = this.ventas;

        if (estado !== 'todos') {
            ventasFiltradas = ventasFiltradas.filter(v => v.estado === estado);
        }

        if (metodoPago !== 'todos') {
            ventasFiltradas = ventasFiltradas.filter(v => v.metodoPago === metodoPago);
        }

        if (fechaInput) {
            const fechaSeleccionada = new Date(fechaInput);
            const fechaMinima = new Date('2025-10-01');
            const fechaMaxima = new Date('2029-12-31');

            if (isNaN(fechaSeleccionada.getTime())) {
                alert('Fecha inválida. Por favor seleccione una fecha válida.');
                return;
            }

            if (fechaSeleccionada < fechaMinima || fechaSeleccionada > fechaMaxima) {
                alert('La fecha debe estar entre el 1 de octubre de 2025 y el 31 de diciembre de 2029.');
                document.getElementById('filtroFecha').value = '';
                return;
            }

            ventasFiltradas = ventasFiltradas.filter(v => {
                const fechaVenta = new Date(v.fecha).toISOString().split('T')[0];
                return fechaVenta === fechaInput;
            });
        }

        this.mostrarVentas(ventasFiltradas);
    }

    limpiarFiltros() {
        document.getElementById('filtroEstado').value = 'todos';
        document.getElementById('filtroMetodoPago').value = 'todos';
        document.getElementById('filtroFecha').value = '';
        document.getElementById('buscarVenta').value = '';
        this.mostrarVentas();
    }

    async verDetalles(idVenta) {
        try {
            console.log('=== 🔍 INICIANDO VER DETALLES ===');

            const url = `/api/Ventas/${idVenta}`;
            console.log('URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.obtenerToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status:', response.status);
            console.log('OK:', response.ok);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ DATOS RECIBIDOS:', data);
                await this.mostrarModalDetalles(data);
                return;
            }

            // Si no es exitosa, mostrar qué pasó
            const text = await response.text();
            console.log('📄 RESPUESTA SERVIDOR:', text.substring(0, 200));

            throw new Error(`API respondió con status ${response.status}`);

        } catch (error) {
            console.log('❌ Error API, usando datos locales:', error.message);

            const venta = this.ventas.find(v => v.id === idVenta);
            if (venta) {
                console.log('✅ Mostrando datos locales');
                this.mostrarModalDetallesConDatosLocales(venta);
            }
        }
    }

    // ✅ FUNCIÓN AUXILIAR para llamar asíncronamente
    async verDetallesAsync(idVenta) {
        await this.verDetalles(idVenta);
    }

    async mostrarModalDetalles(venta) {
        try {
            console.log('🔍 Mostrando modal con datos API:', venta);

            // ✅ VALIDACIONES SEGURAS para datos de la API
            const estado = venta.Estado ? venta.Estado.toLowerCase() :
                venta.estado ? venta.estado.toLowerCase() : 'pendiente';

            const metodoPago = venta.MetodoPago ? venta.MetodoPago.toLowerCase() :
                venta.metodoPago ? venta.metodoPago.toLowerCase() : 'efectivo';

            const usuario = venta.Usuario || venta.usuario || {};

            console.log('Estado API:', estado);
            console.log('Método pago API:', metodoPago);
            console.log('Usuario API:', usuario);

            // ✅ CORRECCIÓN MEJORADA: Manejar productos de la API
            let productos = [];
            if (venta.Productos && Array.isArray(venta.Productos) && venta.Productos.length > 0) {
                productos = venta.Productos;
                console.log(`📦 Productos desde API (venta.Productos): ${productos.length} productos`);
            } else if (venta.productos && Array.isArray(venta.productos) && venta.productos.length > 0) {
                productos = venta.productos;
                console.log(`📦 Productos desde API (venta.productos): ${productos.length} productos`);
            } else if (venta.DetalleVentas && Array.isArray(venta.DetalleVentas) && venta.DetalleVentas.length > 0) {
                productos = venta.DetalleVentas;
                console.log(`📦 Productos desde API (venta.DetalleVentas): ${productos.length} productos`);
            }

            console.log('🔍 Estructura completa de productos:', productos);

            // ✅ OBTENER STOCK ACTUAL PARA CADA PRODUCTO
            const productosConStock = await this.obtenerStockParaProductos(productos);

            const productosHTML = productosConStock.length > 0 ?
                productosConStock.map(p => {
                    const nombre = p.Nombre || p.nombre || 'Producto sin nombre';
                    const cantidad = p.Cantidad || p.cantidad || 1;
                    const precio = p.PrecioUnitario || p.precioUnitario || 0;
                    const stock = p.stockActual !== undefined ? p.stockActual : 'Consultar';
                    const idProducto = p.IdProducto || p.idProducto || 'N/A';
                    const subTotal = p.SubTotal || p.subTotal || (precio * cantidad);

                    console.log(`📋 Producto: ${nombre}, Cantidad: ${cantidad}, Stock Actual: ${stock}`);

                    return `
                        <div class="producto-item">
                            <div>
                                <strong>${nombre}</strong><br>
                                <small>
                                    ID: ${idProducto} | 
                                    Cantidad comprada: ${cantidad} | 
                                    <strong>Stock actual: ${stock}</strong>
                                </small>
                            </div>
                            <div>
                                ${this.formatearPrecio(precio)} c/u<br>
                                <strong>Subtotal: ${this.formatearPrecio(subTotal)}</strong>
                            </div>
                        </div>
                    `;
                }).join('') : '<p>No hay información de productos disponible</p>';

            const datosUsuarioHTML = `
                <div class="detalle-item">
                    <strong>Información del Cliente:</strong>
                </div>
                <div class="detalle-item">
                    <strong>Nombre Completo:</strong> 
                    <span>${usuario.NombreCompleto || usuario.nombreCompleto || 'No disponible'}</span>
                </div>
                <div class="detalle-item">
                    <strong>Email:</strong> 
                    <span>${usuario.Email || usuario.email || 'No disponible'}</span>
                </div>
                <div class="detalle-item">
                    <strong>Teléfono:</strong> 
                    <span>${usuario.Telefono || usuario.telefono || 'No disponible'}</span>
                </div>
                <div class="detalle-item">
                    <strong>Dirección:</strong> 
                    <span>${usuario.Direccion || usuario.direccion || 'No disponible'}</span>
                </div>
                <div class="detalle-item">
                    <strong>Código Postal:</strong> 
                    <span>${usuario.CodigoPostal || usuario.codigoPostal || 'No disponible'}</span>
                </div>
            `;

            document.getElementById('detallesVentaContenido').innerHTML = `
                <div class="detalles-venta">
                    <div class="detalle-item"><strong>ID Venta:</strong> <span>#${venta.IdVenta || venta.idVenta || 'N/A'}</span></div>
                    <div class="detalle-item"><strong>Fecha:</strong> <span>${this.formatearFecha(venta.FechaVenta || venta.fechaVenta)}</span></div>
                    <div class="detalle-item"><strong>Total:</strong> <span>${this.formatearPrecio(venta.Total || venta.total || venta.TotalVenta || venta.totalVenta || 0)}</span></div>
                    <div class="detalle-item"><strong>Estado:</strong> <span class="estado ${estado}">${this.capitalizeFirstLetter(estado)}</span></div>
                    <div class="detalle-item"><strong>Método de Pago:</strong> <span class="metodo-pago">${this.capitalizeFirstLetter(metodoPago)}</span></div>
                    
                    ${datosUsuarioHTML}
                </div>
                <div class="productos-lista">
                    <h3>Productos (${productosConStock.length})</h3>
                    ${productosHTML}
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="cerrarModal('modalDetalleVenta')">Cerrar</button>
                </div>
            `;

            document.getElementById('modalDetalleVenta').style.display = 'flex';

        } catch (error) {
            console.error('❌ Error en mostrarModalDetalles:', error);
            // Fallback a datos locales si hay error
            const ventaLocal = this.ventas.find(v => v.id === (venta.IdVenta || venta.idVenta));
            if (ventaLocal) {
                this.mostrarModalDetallesConDatosLocales(ventaLocal);
            } else {
                alert('Error al mostrar detalles de la venta');
            }
        }
    }

    // ✅ NUEVA FUNCIÓN: Obtener stock actual para productos
    async obtenerStockParaProductos(productos) {
        try {
            console.log('🔄 Obteniendo stock actual para productos...');

            const productosConStock = [];

            for (const producto of productos) {
                const idProducto = producto.IdProducto || producto.idProducto;

                if (idProducto) {
                    try {
                        // Hacer petición para obtener información actual del producto
                        const response = await this.hacerPeticion(`/api/Productos/${idProducto}`);

                        if (response.ok) {
                            const productoActual = await response.json();
                            const stockActual = productoActual.Stock || productoActual.stock || 'No disponible';

                            productosConStock.push({
                                ...producto,
                                stockActual: stockActual
                            });

                            console.log(`✅ Producto ${idProducto}: Stock actual = ${stockActual}`);
                        } else {
                            // Si falla, usar datos originales
                            productosConStock.push({
                                ...producto,
                                stockActual: 'No disponible'
                            });
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error obteniendo stock para producto ${idProducto}:`, error);
                        productosConStock.push({
                            ...producto,
                            stockActual: 'Error al consultar'
                        });
                    }
                } else {
                    // Si no hay ID, usar datos originales
                    productosConStock.push({
                        ...producto,
                        stockActual: 'Sin ID'
                    });
                }
            }

            return productosConStock;
        } catch (error) {
            console.error('❌ Error general obteniendo stock:', error);
            // En caso de error, devolver productos sin stock
            return productos.map(p => ({
                ...p,
                stockActual: 'No disponible'
            }));
        }
    }

    // ✅ FUNCIÓN AGREGADA: Fallback con datos locales
    mostrarModalDetallesConDatosLocales(venta) {
        const productosHTML = venta.productos && venta.productos.length > 0 ?
            venta.productos.map(p => {
                const stock = p.stock !== undefined ? p.stock : 'N/A';
                return `
                    <div class="producto-item">
                        <div>
                            <strong>${p.nombre}</strong><br>
                            <small>
                                ID: ${p.id} | 
                                Cantidad: ${p.cantidad} | 
                                Stock: ${stock}
                            </small>
                        </div>
                        <div>
                            ${this.formatearPrecio(p.precio)} c/u<br>
                            <strong>Subtotal: ${this.formatearPrecio(p.precio * p.cantidad)}</strong>
                        </div>
                    </div>
                `;
            }).join('') : '<p>No hay información de productos disponible</p>';

        const usuario = venta.usuario || {};

        const datosUsuarioHTML = `
            <div class="detalle-item">
                <strong>Información del Cliente:</strong>
            </div>
            <div class="detalle-item">
                <strong>Nombre Completo:</strong>
                <span>${usuario.nombreCompleto || 'No disponible'}</span>
            </div>
            <div class="detalle-item">
                <strong>Email:</strong>
                <span>${usuario.email || 'No disponible'}</span>
            </div>
            <div class="detalle-item">
                <strong>Teléfono:</strong>
                <span>${usuario.telefono || 'No disponible'}</span>
            </div>
            <div class="detalle-item">
                <strong>Dirección:</strong>
                <span>${usuario.direccion || 'No disponible'}</span>
            </div>
            <div class="detalle-item">
                <strong>Código Postal:</strong>
                <span>${usuario.codigoPostal || 'No disponible'}</span>
            </div>
        `;

        document.getElementById('detallesVentaContenido').innerHTML = `
            <div class="detalles-venta">
                <div class="detalle-item"><strong>ID Venta:</strong> <span>#${venta.id}</span></div>
                <div class="detalle-item"><strong>Fecha:</strong> <span>${this.formatearFecha(venta.fecha)}</span></div>
                <div class="detalle-item"><strong>Total:</strong> <span>${this.formatearPrecio(venta.total)}</span></div>
                <div class="detalle-item"><strong>Estado:</strong> <span class="estado ${venta.estado}">${this.capitalizeFirstLetter(venta.estado)}</span></div>
                <div class="detalle-item"><strong>Método de Pago:</strong> <span class="metodo-pago">${this.capitalizeFirstLetter(venta.metodoPago)}</span></div>

                ${datosUsuarioHTML}
            </div>
            <div class="productos-lista">
                <h3>Productos (${venta.productos ? venta.productos.length : 0})</h3>
                ${productosHTML}
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="cerrarModal('modalDetalleVenta')">Cerrar</button>
            </div>
        `;

        document.getElementById('modalDetalleVenta').style.display = 'flex';
    }

    cambiarEstado(idVenta) {
        const venta = this.ventas.find(v => v.id === idVenta);
        if (!venta) return;

        this.ventaSeleccionada = venta;
        document.getElementById('nuevoEstado').value = venta.estado;
        document.getElementById('modalCambiarEstado').style.display = 'flex';
    }

    async confirmarCambioEstado() {
        const nuevoEstado = document.getElementById('nuevoEstado').value;

        try {
            const response = await this.hacerPeticion(`/api/Ventas/${this.ventaSeleccionada.id}/estado`, {
                method: 'PUT',
                body: JSON.stringify({
                    estado: nuevoEstado
                })
            });

            if (response.ok) {
                // Actualizar localmente
                const ventaIndex = this.ventas.findIndex(v => v.id === this.ventaSeleccionada.id);
                if (ventaIndex !== -1) {
                    this.ventas[ventaIndex].estado = nuevoEstado;
                    this.mostrarVentas();
                    this.calcularEstadisticasLocales();
                }

                alert(`✅ Estado cambiado a "${nuevoEstado}" correctamente`);
                cerrarModal('modalCambiarEstado');

                console.log('🔄 Estado actualizado localmente, dashboard recalculado');

            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            alert('Error al cambiar estado: ' + error.message);
        }
    }

    formatearPrecio(precio) {
        const n = Number(precio);
        if (isNaN(n)) return '$0,00';
        const partes = n.toFixed(2).split('.');
        const entero = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `$${entero},${partes[1]}`;
    }

    formatearFecha(fecha) {
        try {
            if (typeof fecha === 'string') {
                const fechaDate = new Date(fecha);
                if (!isNaN(fechaDate.getTime())) {
                    return fechaDate.toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
            } else if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                return fecha.toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
            return 'Fecha no disponible';
        } catch {
            return 'Fecha inválida';
        }
    }

    capitalizeFirstLetter(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Funciones globales
function aplicarFiltros() {
    window.sistemaVentas.aplicarFiltros();
}

function limpiarFiltros() {
    window.sistemaVentas.limpiarFiltros();
}

function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
}

function confirmarCambioEstado() {
    window.sistemaVentas.confirmarCambioEstado();
}

function volverATienda() {
    window.location.href = 'index.html';
}

function cargarVentas() {
    window.sistemaVentas.cargarVentas();
}

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    window.sistemaVentas = new SistemaVentas();
});