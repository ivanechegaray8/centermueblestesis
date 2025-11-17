// ==================== CONFIGURACIÓN API ====================
console.log('🔄 admin.js cargado - Verificando configuración...');

// Solo definir si no existen (por si config.js no se cargó)
if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = 'http://localhost:5269';
    console.log('⚠️ API_BASE definido en admin.js como fallback');
}

if (typeof window.API_PRODUCTOS === 'undefined') {
    window.API_PRODUCTOS = `${window.API_BASE}/api/productos`;
}

if (typeof window.API_CATEGORIAS === 'undefined') {
    window.API_CATEGORIAS = `${window.API_BASE}/api/categorias`;
}

if (typeof window.API_SUBCATEGORIAS === 'undefined') {
    window.API_SUBCATEGORIAS = `${window.API_BASE}/api/subcategorias`;
}

console.log('✅ URLs configuradas:', {
    productos: window.API_PRODUCTOS,
    categorias: window.API_CATEGORIAS,
    subcategorias: window.API_SUBCATEGORIAS
});

// =============================================
// VARIABLES ESPECÍFICAS DEL ADMIN
// =============================================
let productosAdmin = [];
let productosDestacadosIdsAdmin = JSON.parse(localStorage.getItem('productosDestacados')) || [];
let imagenesProducto = [];
let imagenesExistentes = [];
let imagenesAEliminar = [];
let editandoProducto = false;

// =============================================
// VARIABLES DE PAGINACIÓN (CON SUFIJO ADMIN)
// =============================================
let productosPorPaginaAdmin = 20;
let paginaActualAdmin = 1;

// =============================================
// RUTA POR DEFECTO PARA IMÁGENES
// =============================================
const RUTA_IMAGEN_DEFAULT = '/images/productos/sinfoto.png';

// =============================================
// FUNCIONES DE PRODUCTOS DESTACADOS
// =============================================

function esProductoDestacado(idProducto) {
    return productosDestacadosIdsAdmin.includes(idProducto);
}

function guardarProductosDestacados() {
    try {
        localStorage.setItem('productosDestacados', JSON.stringify(productosDestacadosIdsAdmin));
        console.log('✅ Productos destacados guardados en localStorage:', productosDestacadosIdsAdmin);

        // Sincronizar con la variable global si existe
        if (typeof window.productosDestacadosIds !== 'undefined') {
            window.productosDestacadosIds = productosDestacadosIdsAdmin;
        }
    } catch (error) {
        console.error('❌ Error guardando productos destacados:', error);
    }
}

function cargarProductosDestacados() {
    try {
        const destacadosGuardados = localStorage.getItem('productosDestacados');
        if (destacadosGuardados) {
            productosDestacadosIdsAdmin = JSON.parse(destacadosGuardados);
            console.log('✅ Productos destacados cargados desde localStorage:', productosDestacadosIdsAdmin);
        }
    } catch (error) {
        console.error('❌ Error cargando productos destacados:', error);
        productosDestacadosIdsAdmin = [];
    }
}

function toggleProductoDestacado(idProducto, nombreProducto) {
    try {
        const esDestacado = esProductoDestacado(idProducto);

        if (esDestacado) {
            if (!confirm(`¿Estás seguro de quitar "${nombreProducto}" de los productos destacados?`)) {
                return;
            }

            productosDestacadosIdsAdmin = productosDestacadosIdsAdmin.filter(id => id !== idProducto);
            console.log(`✅ Producto ${idProducto} quitado de destacados`);
            mostrarMensajeAdmin(`✅ "${nombreProducto}" quitado de productos destacados`, 'success');

        } else {
            if (!confirm(`¿Estás seguro de agregar "${nombreProducto}" a los productos destacados?`)) {
                return;
            }

            productosDestacadosIdsAdmin.push(idProducto);
            console.log(`✅ Producto ${idProducto} agregado a destacados`);
            mostrarMensajeAdmin(`✅ "${nombreProducto}" agregado a productos destacados`, 'success');
        }

        guardarProductosDestacados();

        // REORDENAR productos después de cambiar destacados
        productosAdmin = ordenarProductosDestacadosPrimero(productosAdmin);
        if (window.productosFiltrados) {
            window.productosFiltrados = ordenarProductosDestacadosPrimero(window.productosFiltrados);
        }

        const busqueda = document.getElementById('buscar-producto').value.toLowerCase().trim();
        if (busqueda) {
            mostrarProductosFiltradosPaginados(window.productosFiltrados, busqueda);
        } else {
            mostrarProductosPaginados();
        }

    } catch (error) {
        console.error('❌ Error al alternar producto destacado:', error);
        mostrarMensajeAdmin('❌ Error: ' + error.message, 'error');
    }
}

// =============================================
// FUNCIONES DE PAGINACIÓN (ACTUALIZADAS)
// =============================================

function mostrarProductosPaginados() {
    const contenedor = document.getElementById('contenedor-lista-productos');
    const paginacionContainer = document.getElementById('paginacion-container');
    const infoPaginacion = document.getElementById('info-paginacion');
    const paginaActualSpan = document.getElementById('pagina-actual');
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');

    if (!productosAdmin || productosAdmin.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div>📦</div>
                <h3>No hay productos cargados</h3>
                <p>Usa el formulario de arriba para agregar tu primer producto</p>
                <button onclick="cargarProductosAdmin()" class="btn-leer-mas" style="margin-top: 10px;">
                    🔄 Reintentar Carga
                </button>
            </div>
        `;
        if (paginacionContainer) paginacionContainer.style.display = 'none';
        return;
    }

    const inicio = (paginaActualAdmin - 1) * productosPorPaginaAdmin;
    const fin = inicio + productosPorPaginaAdmin;
    const productosPagina = productosAdmin.slice(inicio, fin);
    const totalPaginas = Math.ceil(productosAdmin.length / productosPorPaginaAdmin);

    contenedor.innerHTML = productosPagina.map(producto => {
        const imagenes = producto.Imagenes || producto.imagenes || [];
        const cantidadImagenes = Array.isArray(imagenes) ? imagenes.length : 0;
        const esDestacado = esProductoDestacado(producto.idProducto);

        return `
            <div class="producto-item">
                <div class="producto-info">
                    <div class="producto-nombre">
                        ${producto.nombre}
                        ${esDestacado ? '<span class="producto-destacado-badge">⭐ Destacado</span>' : ''}
                        ${cantidadImagenes > 0 ?
                `<span class="producto-imagenes-count">${cantidadImagenes} 🖼️</span>` :
                ''
            }
                    </div>
                    <div class="producto-detalles">
                        $${formatearPrecio(producto.precio)} | Stock: ${producto.stock}
                        ${producto.nombreCategoria ? `| ${producto.nombreCategoria}` : ''}
                        ${producto.nombreSubcategoria ? `> ${producto.nombreSubcategoria}` : ''}
                    </div>
                </div>
                <div class="producto-acciones">
                    <button class="btn-destacado ${esDestacado ? 'destacado' : ''}" 
                            onclick="toggleProductoDestacado(${producto.idProducto}, '${producto.nombre.replace(/'/g, "\\'")}')"
                            title="${esDestacado ? 'Quitar de destacados' : 'Agregar a destacados'}">
                        ${esDestacado ? '★ Destacado' : '☆ Destacar'}
                    </button>
                    <button class="btn-editar" onclick="editarProducto(${producto.idProducto})">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${producto.idProducto})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (paginaActualSpan) paginaActualSpan.textContent = paginaActualAdmin;
    if (infoPaginacion) {
        infoPaginacion.textContent = `Mostrando ${inicio + 1}-${Math.min(fin, productosAdmin.length)} de ${productosAdmin.length} productos`;
    }

    if (btnAnterior) btnAnterior.disabled = paginaActualAdmin === 1;
    if (btnSiguiente) btnSiguiente.disabled = paginaActualAdmin === totalPaginas;

    if (paginacionContainer) paginacionContainer.style.display = 'flex';
}

function mostrarProductosFiltradosPaginados(productosFiltradosArray, busqueda = '') {
    const contenedor = document.getElementById('contenedor-lista-productos');
    const paginacionContainer = document.getElementById('paginacion-container');
    const infoPaginacion = document.getElementById('info-paginacion');
    const paginaActualSpan = document.getElementById('pagina-actual');
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');

    if (!productosFiltradosArray || productosFiltradosArray.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <div>🔍</div>
                <h3>No se encontraron productos</h3>
                <p>No hay productos que coincidan con "<strong>${busqueda}</strong>"</p>
                <button onclick="limpiarBusqueda()" class="btn-leer-mas" style="margin-top: 10px;">
                    🔄 Mostrar todos los productos
                </button>
            </div>
        `;
        if (paginacionContainer) paginacionContainer.style.display = 'none';
        return;
    }

    const inicio = (paginaActualAdmin - 1) * productosPorPaginaAdmin;
    const fin = inicio + productosPorPaginaAdmin;
    const productosPagina = productosFiltradosArray.slice(inicio, fin);
    const totalPaginas = Math.ceil(productosFiltradosArray.length / productosPorPaginaAdmin);

    contenedor.innerHTML = productosPagina.map(producto => {
        const imagenes = producto.Imagenes || producto.imagenes || [];
        const cantidadImagenes = Array.isArray(imagenes) ? imagenes.length : 0;
        const esDestacado = esProductoDestacado(producto.idProducto);

        const nombreResaltado = resaltarCoincidencias(producto.nombre, busqueda);

        return `
            <div class="producto-item">
                <div class="producto-info">
                    <div class="producto-nombre">
                        ${nombreResaltado}
                        ${esDestacado ? '<span class="producto-destacado-badge">⭐ Destacado</span>' : ''}
                        ${cantidadImagenes > 0 ?
                `<span class="producto-imagenes-count">${cantidadImagenes} 🖼️</span>` :
                ''
            }
                    </div>
                    <div class="producto-detalles">
                        $${producto.precio} | Stock: ${producto.stock}
                        ${producto.nombreCategoria ? `| ${producto.nombreCategoria}` : ''}
                        ${producto.nombreSubcategoria ? `> ${producto.nombreSubcategoria}` : ''}
                    </div>
                </div>
                <div class="producto-acciones">
                    <button class="btn-destacado ${esDestacado ? 'destacado' : ''}" 
                            onclick="toggleProductoDestacado(${producto.idProducto}, '${producto.nombre.replace(/'/g, "\\'")}')"
                            title="${esDestacado ? 'Quitar de destacados' : 'Agregar a destacados'}">
                        ${esDestacado ? '★ Destacado' : '☆ Destacar'}
                    </button>
                    <button class="btn-editar" onclick="editarProducto(${producto.idProducto})">
                        ✏️ Editar
                    </button>
                    <button class="btn-eliminar" onclick="eliminarProducto(${producto.idProducto})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (paginaActualSpan) paginaActualSpan.textContent = paginaActualAdmin;
    if (infoPaginacion) {
        infoPaginacion.textContent = `Mostrando ${inicio + 1}-${Math.min(fin, productosFiltradosArray.length)} de ${productosFiltradosArray.length} productos (filtrados)`;
    }

    if (btnAnterior) btnAnterior.disabled = paginaActualAdmin === 1;
    if (btnSiguiente) btnSiguiente.disabled = paginaActualAdmin === totalPaginas;

    if (paginacionContainer) paginacionContainer.style.display = 'flex';
}

function cambiarProductosPorPagina(cantidad) {
    productosPorPaginaAdmin = parseInt(cantidad);
    paginaActualAdmin = 1;

    const busqueda = document.getElementById('buscar-producto').value.toLowerCase().trim();
    if (busqueda) {
        mostrarProductosFiltradosPaginados(window.productosFiltrados, busqueda);
    } else {
        mostrarProductosPaginados();
    }
}

function cambiarPagina(direccion) {
    // Guardar posición actual del scroll
    const scrollPosition = window.scrollY;
    const listaProductos = document.getElementById('lista-productos');
    const listaPosition = listaProductos ? listaProductos.offsetTop : 0;

    const totalProductos = (window.productosFiltrados && window.productosFiltrados.length > 0) ?
        window.productosFiltrados.length : productosAdmin.length;
    const totalPaginas = Math.ceil(totalProductos / productosPorPaginaAdmin);

    const nuevaPagina = paginaActualAdmin + direccion;

    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActualAdmin = nuevaPagina;

        const busqueda = document.getElementById('buscar-producto').value.toLowerCase().trim();
        if (busqueda) {
            mostrarProductosFiltradosPaginados(window.productosFiltrados, busqueda);
        } else {
            mostrarProductosPaginados();
        }

        // Restaurar posición del scroll después de un pequeño delay
        setTimeout(() => {
            // Intentar mantener la posición exacta, o al menos ir a la sección de productos
            if (scrollPosition > 0) {
                window.scrollTo(0, scrollPosition);
            } else if (listaProductos) {
                listaProductos.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================
function mostrarMensajeAdmin(texto, tipo) {
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
    } else {
        alert(`${tipo}: ${texto}`);
    }
}

function resaltarCoincidencias(texto, busqueda) {
    if (!busqueda) return texto;
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return texto.replace(regex, '<mark style="background: #fff3cd; padding: 2px 4px; border-radius: 2px;">$1</mark>');
}

function formatearPrecio(precio) {
    if (typeof precio !== 'number') {
        precio = parseFloat(precio) || 0;
    }
    return precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function aplicarFormatoPrecios() {
    const elementosPrecio = document.querySelectorAll('.producto-detalles');
    let preciosFormateados = 0;

    elementosPrecio.forEach(elemento => {
        const textoOriginal = elemento.textContent || elemento.innerText;
        let textoModificado = textoOriginal;

        // Patrón 1: Precios que ya tienen $ pero sin formato (ej: $2000 |)
        textoModificado = textoModificado.replace(/\$(\d+)\s*\|/g, (match, precio) => {
            const precioFormateado = formatearPrecio(precio);
            preciosFormateados++;
            return `$${precioFormateado} |`;
        });

        // Patrón 2: Buscar patrones como "2000 | Stock" y convertirlos a "$2.000 | Stock"
        textoModificado = textoModificado.replace(/(\d{4,})\s*\|/g, (match, precio) => {
            const precioFormateado = formatearPrecio(precio);
            preciosFormateados++;
            return `$${precioFormateado} |`;
        });

        // Aplicar cambios si hubo modificaciones
        if (textoModificado !== textoOriginal) {
            elemento.textContent = textoModificado;
        }
    });

    console.log(`✅ Formato aplicado: ${preciosFormateados} precios en ${elementosPrecio.length} productos`);
    return preciosFormateados;
}

// =============================================
// FUNCIONES DE MODAL
// =============================================

function mostrarModalGestion() {
    console.log('📦 Abriendo modal de gestión');

    // Resetear primero
    resetearFormularioAdmin();

    // Luego crear sección de imágenes si no existe
    const contenedorImagenes = document.getElementById('contenedor-inputs-imagen');
    if (!contenedorImagenes || contenedorImagenes.innerHTML.trim() === '') {
        console.log('🖼️ Creando sección de imágenes en modal...');
        crearSeccionImagenes();
    }

    document.getElementById('modal-titulo').textContent = '📦 Agregar Producto';
    document.getElementById('modal-gestion').style.display = 'block';
}

function cerrarModalGestion() {
    console.log('🔒 Cerrando modal de gestión');

    const modal = document.getElementById('modal-gestion');
    if (modal) {
        modal.style.display = 'none';
    }

    resetearFormularioAdmin();
    console.log('✅ Modal cerrado correctamente');
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

async function cargarProductosAdmin() {
    try {
        console.log('🔄 Cargando productos para admin...');

        const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
        console.log('🔐 Token disponible:', !!token);

        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('🌐 Haciendo petición a:', window.API_PRODUCTOS);
        const response = await fetch(window.API_PRODUCTOS, { headers });

        console.log('📨 Respuesta de la API:', response.status, response.statusText);

        if (!response.ok) {
            if (token && response.status === 401) {
                console.log('🔁 Token inválido, intentando sin autenticación...');
                const responseSinToken = await fetch(window.API_PRODUCTOS);
                if (responseSinToken.ok) {
                    let productos = await responseSinToken.json();
                    // ORDENAR: destacados primero
                    productos = ordenarProductosDestacadosPrimero(productos);
                    productosAdmin = productos;
                    console.log('✅ Productos cargados SIN autenticación (ordenados):', productosAdmin);
                    mostrarProductosPaginados();
                    return;
                }
            }
            throw new Error(`Error ${response.status} al cargar productos`);
        }

        let productos = await response.json();
        // ORDENAR: destacados primero
        productos = ordenarProductosDestacadosPrimero(productos);
        productosAdmin = productos;
        console.log('✅ Productos cargados para admin (ordenados):', productosAdmin);

        mostrarProductosPaginados();

    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        const contenedor = document.getElementById('contenedor-lista-productos');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div>⚠️</div>
                    <h3>Error al cargar productos</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 14px; margin-top: 10px;">
                        Verifica que la API esté funcionando en:<br>
                        <code>${window.API_PRODUCTOS}</code>
                    </p>
                    <button onclick="cargarProductosAdmin()" class="btn-leer-mas" style="margin-top: 10px;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para ordenar productos: destacados primero
function ordenarProductosDestacadosPrimero(productos) {
    if (!productos || !Array.isArray(productos)) return productos;

    return productos.sort((a, b) => {
        const aDestacado = esProductoDestacado(a.idProducto);
        const bDestacado = esProductoDestacado(b.idProducto);

        if (aDestacado && !bDestacado) return -1; // a primero
        if (!aDestacado && bDestacado) return 1;  // b primero

        // Si ambos son destacados o ninguno es destacado, ordenar por nombre
        return a.nombre.localeCompare(b.nombre);
    });
}

function cargarListaProductosAdmin() {
    mostrarProductosPaginados();
}

// =============================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// =============================================

function filtrarProductos() {
    const busqueda = document.getElementById('buscar-producto').value.toLowerCase().trim();
    const contador = document.getElementById('contador-busqueda');

    paginaActualAdmin = 1;

    if (contador) {
        contador.textContent = `${busqueda.length}/60 caracteres`;
        contador.style.color = busqueda.length >= 55 ? '#e74c3c' : busqueda.length >= 45 ? '#f39c12' : '#666';
    }

    if (!busqueda) {
        mostrarProductosPaginados();
        return;
    }

    console.log(`🔍 Buscando localmente: "${busqueda}"`);

    if (productosAdmin.length === 0) {
        console.log('🔄 No hay productos cargados, cargando primero...');
        const contenedor = document.getElementById('contenedor-lista-productos');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="empty-state">
                    <div>📦</div>
                    <h3>Primero carga los productos</h3>
                    <p>No hay productos cargados para buscar</p>
                    <button onclick="cargarProductosAdmin()" class="btn-leer-mas" style="margin-top: 10px;">
                        📥 Cargar Productos
                    </button>
                </div>
            `;
        }
        return;
    }

    let productosFiltrados = productosAdmin.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda)
    );

    // ORDENAR resultados de búsqueda también: destacados primero
    productosFiltrados = ordenarProductosDestacadosPrimero(productosFiltrados);

    window.productosFiltrados = productosFiltrados;

    console.log(`✅ Encontrados ${productosFiltrados.length} productos (ordenados)`);

    mostrarProductosFiltradosPaginados(productosFiltrados, busqueda);
}

function mostrarProductosFiltrados(productosFiltradosArray, terminoBusqueda) {
    mostrarProductosFiltradosPaginados(productosFiltradosArray, terminoBusqueda);
}

function limpiarBusqueda() {
    const inputBusqueda = document.getElementById('buscar-producto');
    const contador = document.getElementById('contador-busqueda');

    if (inputBusqueda) {
        inputBusqueda.value = '';
    }

    if (contador) {
        contador.textContent = 'Máximo 60 caracteres';
        contador.style.color = '#666';
    }

    paginaActualAdmin = 1;
    mostrarProductosPaginados();
}

function configurarBusquedaConEnter() {
    const inputBusqueda = document.getElementById('buscar-producto');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                filtrarProductos();
            }
        });
    }
}

async function cargarCategoriasAdmin() {
    try {
        console.log('🔍 Cargando categorías desde:', window.API_CATEGORIAS);
        const response = await fetch(window.API_CATEGORIAS);

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
        mostrarMensajeAdmin('❌ Error al cargar categorías: ' + error.message, 'error');
    }
}

async function cargarSubcategoriasAdmin(idCategoria) {
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

        const response = await fetch(window.API_SUBCATEGORIAS);

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

async function gestionarProducto(event) {
    event.preventDefault();

    const boton = document.getElementById('btn-submit');
    const idSubcategoria = document.getElementById('subcategoria').value;

    if (!idSubcategoria) {
        mostrarMensajeAdmin('❌ Por favor selecciona una categoría y subcategoría válida', 'error');
        return;
    }

    try {
        boton.innerHTML = '⏳ Procesando...';
        boton.disabled = true;

        const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');

        if (!token) {
            throw new Error('No hay token de autenticación. Debes iniciar sesión.');
        }

        const producto = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            idSubcategoria: parseInt(idSubcategoria),
            destacado: false,
            // AGREGAR RUTA POR DEFECTO SI NO HAY IMÁGENES
            rutaImagen: imagenesProducto.length > 0 ? '' : RUTA_IMAGEN_DEFAULT
        };

        let response;
        let metodo = 'POST';
        let url = window.API_PRODUCTOS;
        let productoId = null;

        if (editandoProducto) {
            // OBTENER CORRECTAMENTE EL ID DEL PRODUCTO EN EDICIÓN
            productoId = parseInt(document.getElementById('producto-id').value);

            if (!productoId || productoId === 0) {
                throw new Error('ID de producto inválido en modo edición');
            }

            metodo = 'PUT';
            url = `${window.API_PRODUCTOS}/${productoId}`;
            producto.idProducto = productoId;

            delete producto.nombre;
            delete producto.idSubcategoria;
            delete producto.destacado;
            delete producto.rutaImagen; // En edición, no modificamos la rutaImagen

            console.log(`📤 Enviando ACTUALIZACIÓN para producto ID: ${productoId}`, producto);
        } else {
            console.log(`📤 Enviando NUEVO producto:`, producto);
        }

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

        // OBTENER EL ID CORRECTO DEPENDIENDO DEL MODO
        if (editandoProducto) {
            productoId = productoId; // Ya lo tenemos del formulario
        } else {
            productoId = resultado.idProducto || resultado.id;
        }

        console.log(`✅ Producto ${editandoProducto ? 'actualizado' : 'creado'} con ID: ${productoId}`);

        if (editandoProducto) {
            await procesarImagenesEnEdicion(productoId);
            mostrarMensajeAdmin('✅ Producto actualizado exitosamente!', 'success');
        } else {
            if (imagenesProducto.length > 0) {
                console.log(`📤 Subiendo ${imagenesProducto.length} imágenes para nuevo producto ID: ${productoId}...`);
                const exito = await subirImagenesProducto(productoId);
                if (!exito) {
                    mostrarMensajeAdmin('✅ Producto creado, pero hubo error con algunas imágenes', 'warning');
                } else {
                    mostrarMensajeAdmin('✅ Producto creado exitosamente con imágenes!', 'success');
                }
            } else {
                mostrarMensajeAdmin('✅ Producto creado exitosamente con imagen por defecto!', 'success');
            }
        }

        resetearFormularioAdmin();
        await cargarProductosAdmin();

        document.getElementById('modal-gestion').style.display = 'none';

    } catch (error) {
        console.error('❌ Error completo:', error);
        mostrarMensajeAdmin('❌ Error al procesar producto: ' + error.message, 'error');
    } finally {
        if (boton) {
            boton.innerHTML = editandoProducto ? '💾 Guardar Cambios' : '➕ Agregar Producto';
            boton.disabled = false;
        }
    }
}

async function subirImagenesProducto(productoId) {
    // VERIFICACIÓN ADICIONAL DE SEGURIDAD
    if (!productoId || productoId === 0) {
        console.error('❌ ID de producto inválido para subir imágenes:', productoId);
        return false;
    }

    const archivos = imagenesProducto.map(img => img.archivo);

    if (archivos.length === 0) {
        console.log('ℹ️ No hay imágenes para subir');
        return true;
    }

    try {
        console.log(`📤 Subiendo ${archivos.length} imágenes para producto ${productoId}...`);

        const formData = new FormData();

        archivos.forEach(archivo => {
            formData.append('archivos', archivo);
        });

        const endpoint = `${window.API_PRODUCTOS}/${productoId}/imagenes`;
        console.log(`🔍 Usando endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });

        console.log(`📨 Respuesta del servidor:`, response.status, response.statusText);

        if (response.ok) {
            const resultado = await response.json();
            console.log('✅ Imágenes subidas exitosamente:', resultado);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`❌ Error ${response.status} subiendo imágenes:`, errorText);

            if (response.status === 404) {
                console.error(`❌ Producto con ID ${productoId} no encontrado en el servidor`);
                mostrarMensajeAdmin(`❌ Error: El producto no existe en el servidor (ID: ${productoId})`, 'error');
            }

            return false;
        }

    } catch (error) {
        console.error('❌ Error de conexión subiendo imágenes:', error);
        mostrarMensajeAdmin('❌ Error de conexión al subir imágenes', 'error');
        return false;
    }
}

async function procesarImagenesEnEdicion(productoId) {
    // VERIFICAR QUE EL PRODUCTO ID SEA VÁLIDO
    if (!productoId || productoId === 0) {
        console.error('❌ ID de producto inválido para procesar imágenes:', productoId);
        mostrarMensajeAdmin('❌ Error: ID de producto inválido', 'error');
        return;
    }

    let huboErrores = false;

    try {
        if (imagenesAEliminar.length > 0) {
            console.log(`🗑️ Eliminando ${imagenesAEliminar.length} imágenes para producto ${productoId}...`);
            const eliminacionesExitosas = await eliminarImagenesSeleccionadas();

            if (eliminacionesExitosas < imagenesAEliminar.length) {
                huboErrores = true;
            }
        }

        if (imagenesProducto.length > 0) {
            console.log(`📤 Subiendo ${imagenesProducto.length} nuevas imágenes para producto ${productoId}...`);
            const exito = await subirImagenesProducto(productoId);

            if (!exito) {
                huboErrores = true;
            }
        }

        if (huboErrores) {
            mostrarMensajeAdmin('✅ Producto actualizado, pero hubo problemas con algunas imágenes', 'warning');
        } else {
            mostrarMensajeAdmin('✅ Producto e imágenes actualizados exitosamente!', 'success');
        }

    } catch (error) {
        console.error('❌ Error procesando imágenes:', error);
        mostrarMensajeAdmin('✅ Producto actualizado, pero hubo error con las imágenes', 'warning');
    }
}

async function eliminarImagenesSeleccionadas() {
    const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');
    let eliminacionesExitosas = 0;

    console.log(`🗑️ Eliminando ${imagenesAEliminar.length} imágenes...`);

    for (const idImagen of imagenesAEliminar) {
        if (idImagen > 0) {
            try {
                console.log(`🔍 Eliminando imagen ID: ${idImagen}`);

                // USAR EL ENDPOINT CORRECTO: api/productos/imagenes/{idImagen}
                const response = await fetch(`${window.API_PRODUCTOS}/imagenes/${idImagen}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log(`📨 Respuesta del servidor:`, response.status, response.statusText);

                if (response.ok) {
                    eliminacionesExitosas++;
                    console.log(`✅ Imagen ${idImagen} eliminada correctamente`);
                } else {
                    const errorText = await response.text();
                    console.error(`❌ Error ${response.status} eliminando imagen ${idImagen}:`, errorText);

                    // Si es error 404, la imagen ya no existe, contar como éxito
                    if (response.status === 404) {
                        eliminacionesExitosas++;
                        console.log(`ℹ️ Imagen ${idImagen} ya no existe, contando como eliminada`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error de conexión eliminando imagen ${idImagen}:`, error);
            }
        } else {
            // IDs temporales (menores o iguales a 0) se cuentan como eliminados
            eliminacionesExitosas++;
        }
    }

    console.log(`📊 Eliminaciones exitosas: ${eliminacionesExitosas} de ${imagenesAEliminar.length}`);
    return eliminacionesExitosas;
}

async function editarProducto(id) {
    try {
        console.log(`📝 Editando producto ID: ${id}`);

        let producto = productosAdmin.find(p => p.idProducto == id);

        if (!producto) {
            console.log('🔍 Producto no encontrado localmente, cargando desde API...');
            const response = await fetch(`${window.API_PRODUCTOS}/${id}`);
            if (!response.ok) throw new Error('Error al cargar producto');
            producto = await response.json();
        }

        console.log('📝 Producto a editar:', producto);

        document.getElementById('producto-id').value = producto.idProducto;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('precio').value = producto.precio;
        document.getElementById('stock').value = producto.stock;

        await cargarCategoriaYSubcategoria(producto.idSubcategoria, true);

        await cargarImagenesExistentes(producto.idProducto);

        document.getElementById('btn-submit').innerHTML = '💾 Guardar Cambios';
        document.getElementById('modal-titulo').textContent = `✏️ Editando: ${producto.nombre}`;

        editandoProducto = true;

        document.getElementById('modal-gestion').style.display = 'block';

    } catch (error) {
        console.error('Error al cargar producto para edición:', error);
        mostrarMensajeAdmin('❌ Error al cargar producto: ' + error.message, 'error');
    }
}

async function cargarCategoriaYSubcategoria(idSubcategoria, modoBloqueado = false) {
    if (!idSubcategoria) return;

    try {
        await cargarCategoriasAdmin();

        const response = await fetch(`${window.API_SUBCATEGORIAS}/${idSubcategoria}`);
        if (response.ok) {
            const subcategoria = await response.json();
            const idCategoria = subcategoria.idCategoria;

            if (idCategoria) {
                const selectCategoria = document.getElementById('categoria');
                if (selectCategoria) {
                    selectCategoria.value = idCategoria;

                    if (modoBloqueado) {
                        selectCategoria.disabled = true;
                        selectCategoria.style.background = '#f8f9fa';
                        selectCategoria.style.cursor = 'not-allowed';
                    }

                    await cargarSubcategoriasAdmin(idCategoria);

                    setTimeout(() => {
                        const selectSubcategoria = document.getElementById('subcategoria');
                        if (selectSubcategoria) {
                            selectSubcategoria.value = idSubcategoria;

                            if (modoBloqueado) {
                                selectSubcategoria.disabled = true;
                                selectSubcategoria.style.background = '#f8f9fa';
                                selectSubcategoria.style.cursor = 'not-allowed';
                            }
                        }
                    }, 300);
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar categoría/subcategoría:', error);
    }
}

// ==================== NUEVO SISTEMA DE IMÁGENES ====================

function crearSeccionImagenes() {
    const contenedorImagenes = document.getElementById('contenedor-inputs-imagen');
    if (!contenedorImagenes) {
        console.error('❌ No se encontró el contenedor de imágenes');
        return;
    }

    console.log('🖼️ Creando sección de imágenes...');

    contenedorImagenes.innerHTML = `
        <div class="seccion-imagenes-nueva">
            <h4>🖼️ Gestión de Imágenes del Producto</h4>
            
            <!-- Información importante -->
            <div class="info-imagenes" style="background: #e3f2fd; border-left-color: #2196f3;">
                <div style="flex: 1;">
                    <strong>💡 Información:</strong>
                    <p style="margin: 5px 0; font-size: 0.9em; color: #555;">
                        Si no subes imágenes, se usará: <code>${RUTA_IMAGEN_DEFAULT}</code>
                    </p>
                </div>
            </div>
            
            <!-- Área de arrastrar y soltar -->
            <div class="drop-area" id="drop-area">
                <div class="drop-content">
                    <div class="drop-icon">📁</div>
                    <h5>Arrastra y suelta imágenes aquí</h5>
                    <p>Formatos: JPG, PNG, GIF • Máximo: 5MB por imagen</p>
                    <p class="drop-subtitle">O haz clic para seleccionar archivos</p>
                    <button type="button" class="btn-seleccionar-archivos" onclick="document.getElementById('file-input-imagenes').click()">
                        📸 Seleccionar Imágenes
                    </button>
                </div>
                <input type="file" id="file-input-imagenes" multiple accept="image/jpeg,image/jpg,image/png,image/gif" style="display: none;">
            </div>

            <!-- Información de límites -->
            <div class="info-imagenes">
                <div class="contador-imagenes">
                    <span id="contador-imagenes-actual">0</span>/5 imágenes máximo
                </div>
                <div class="tamano-maximo">
                    📏 Máx. 5MB por imagen
                </div>
            </div>

            <!-- Vista previa de imágenes -->
            <div class="vista-previa-contenedor">
                <h6>Vista Previa de Imágenes</h6>
                <div class="vista-previa-grid" id="vista-previa-imagenes">
                    <div class="empty-state">
                        <div>🖼️</div>
                        <p>No hay imágenes seleccionadas</p>
                        <small>Se usará imagen por defecto si no agregas imágenes</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Configurar eventos después de crear el HTML
    setTimeout(() => {
        configurarDragAndDrop();
        configurarInputArchivos();
        actualizarContadorImagenes();
    }, 100);

    console.log('✅ Sección de imágenes creada correctamente');
}

function configurarDragAndDrop() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input-imagenes');

    if (!dropArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        procesarArchivos(files);
    }
}

function configurarInputArchivos() {
    const fileInput = document.getElementById('file-input-imagenes');
    if (!fileInput) {
        console.error('❌ No se encontró el input de archivos');
        return;
    }

    fileInput.addEventListener('change', function (e) {
        console.log('📁 Archivos seleccionados:', e.target.files.length);
        procesarArchivos(e.target.files);
        this.value = ''; // Resetear input
    });

    console.log('✅ Input de archivos configurado');
}

function procesarArchivos(files) {
    if (!files || files.length === 0) return;

    const archivosArray = Array.from(files);

    const espaciosDisponibles = 5 - imagenesProducto.length;
    if (archivosArray.length > espaciosDisponibles) {
        mostrarMensajeAdmin(`❌ Solo puedes agregar ${espaciosDisponibles} imagen(es) más. Máximo 5 imágenes.`, 'error');
        archivosArray.splice(espaciosDisponibles);
    }

    let archivosProcesados = 0;
    let archivosInvalidos = 0;
    let archivosDemasiadoGrandes = 0;
    let archivosFormatoInvalido = 0;

    archivosArray.forEach(archivo => {
        if (validarArchivoImagen(archivo)) {
            agregarImagenALista(archivo);
            archivosProcesados++;
        } else {
            archivosInvalidos++;

            // Detectar el tipo específico de error
            const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            const tamanoMaximo = 5 * 1024 * 1024;

            if (!tiposPermitidos.includes(archivo.type)) {
                archivosFormatoInvalido++;
            } else if (archivo.size > tamanoMaximo) {
                archivosDemasiadoGrandes++;
            }
        }
    });

    // Mostrar mensajes detallados
    if (archivosProcesados > 0) {
        mostrarMensajeAdmin(`✅ ${archivosProcesados} imagen(es) agregada(s) correctamente`, 'success');
    }

    if (archivosDemasiadoGrandes > 0) {
        mostrarMensajeAdmin(`❌ ${archivosDemasiadoGrandes} imagen(es) exceden el tamaño máximo de 5MB`, 'error');
    }

    if (archivosFormatoInvalido > 0) {
        mostrarMensajeAdmin(`❌ ${archivosFormatoInvalido} archivo(s) no son imágenes válidas (solo JPG, PNG, GIF)`, 'error');
    }

    if (archivosInvalidos > 0 && archivosDemasiadoGrandes === 0 && archivosFormatoInvalido === 0) {
        mostrarMensajeAdmin(`⚠️ ${archivosInvalidos} archivo(s) no pudieron ser procesados`, 'warning');
    }

    actualizarContadorImagenes();
}

function validarArchivoImagen(archivo) {
    if (!(archivo instanceof File)) {
        return false;
    }

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!tiposPermitidos.includes(archivo.type)) {
        return false;
    }

    const tamanoMaximo = 5 * 1024 * 1024; // 5MB
    if (archivo.size > tamanoMaximo) {
        return false;
    }

    if (archivo.size === 0) {
        return false;
    }

    return true;
}

function agregarImagenALista(archivo) {
    if (imagenesProducto.length >= 5) {
        mostrarMensajeAdmin('❌ Máximo 5 imágenes por producto', 'error');
        return false;
    }

    try {
        const imagenId = 'preview-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        const imageUrl = URL.createObjectURL(archivo);

        const vistaPrevia = document.getElementById('vista-previa-imagenes');
        const mensajeVacio = vistaPrevia.querySelector('.empty-state');

        if (mensajeVacio) {
            mensajeVacio.remove();
        }

        const imagenHTML = `
            <div class="imagen-item-nueva" id="${imagenId}">
                <div class="imagen-preview-container">
                    <img src="${imageUrl}" class="imagen-preview-nueva" alt="Vista previa" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2VuPC90ZXh0Pjwvc3ZnPg=='">
                    <div class="imagen-overlay">
                        <button type="button" onclick="eliminarImagen('${imagenId}')" class="btn-eliminar-overlay">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="imagen-info-nueva">
                    <div class="imagen-nombre">${archivo.name}</div>
                    <div class="imagen-tamano">${(archivo.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
            </div>
        `;

        vistaPrevia.insertAdjacentHTML('beforeend', imagenHTML);

        imagenesProducto.push({
            id: imagenId,
            archivo: archivo,
            objectUrl: imageUrl,
            elemento: document.getElementById(imagenId)
        });

        console.log('✅ Imagen agregada. Total:', imagenesProducto.length);
        return true;

    } catch (error) {
        console.error('❌ Error al agregar imagen a la lista:', error);
        mostrarMensajeAdmin('❌ Error al procesar la imagen', 'error');
        return false;
    }
}

function eliminarImagen(imagenId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
    }

    const imagenIndex = imagenesProducto.findIndex(img => img.id === imagenId);
    if (imagenIndex === -1) return;

    const imagen = imagenesProducto[imagenIndex];

    if (imagen.objectUrl) {
        URL.revokeObjectURL(imagen.objectUrl);
    }

    if (imagen.elemento) {
        imagen.elemento.remove();
    }

    imagenesProducto.splice(imagenIndex, 1);

    const vistaPrevia = document.getElementById('vista-previa-imagenes');
    if (vistaPrevia.children.length === 0) {
        vistaPrevia.innerHTML = `
            <div class="empty-state">
                <div>🖼️</div>
                <p>No hay imágenes seleccionadas</p>
                <small>Se usará imagen por defecto si no agregas imágenes</small>
            </div>
        `;
    }

    actualizarContadorImagenes();
    mostrarMensajeAdmin('✅ Imagen eliminada', 'success');
}

function actualizarContadorImagenes() {
    const contador = document.getElementById('contador-imagenes-actual');
    if (contador) {
        const totalImagenes = imagenesProducto.length + imagenesExistentes.length;
        contador.textContent = totalImagenes;

        if (totalImagenes >= 5) {
            contador.style.color = '#e74c3c';
        } else if (totalImagenes >= 3) {
            contador.style.color = '#f39c12';
        } else {
            contador.style.color = '#27ae60';
        }

        console.log(`🔢 Contador actualizado: ${totalImagenes} imágenes`);
    }
}

async function cargarImagenesExistentes(productoId) {
    try {
        console.log(`🖼️ Cargando imágenes existentes para producto ID: ${productoId}`);

        const producto = productosAdmin.find(p => p.idProducto == productoId);
        let imagenes = [];

        if (producto && producto.Imagenes && Array.isArray(producto.Imagenes)) {
            imagenes = producto.Imagenes;
        } else if (producto && producto.imagenes && Array.isArray(producto.imagenes)) {
            imagenes = producto.imagenes;
        }

        imagenesExistentes = [];
        imagenesAEliminar = [];

        const vistaPrevia = document.getElementById('vista-previa-imagenes');
        vistaPrevia.innerHTML = '';

        if (imagenes.length === 0) {
            vistaPrevia.innerHTML = `
                <div class="empty-state">
                    <div>🖼️</div>
                    <p>No hay imágenes para este producto</p>
                </div>
            `;
            return;
        }

        imagenes.forEach((imagen, index) => {
            const imagenId = 'existente-' + (imagen.idImagen || `temp-${productoId}-${index}`);
            const rutaImagen = imagen.rutaImagen || imagen.RutaImagen || '/img/placeholder.jpg';

            const imagenHTML = `
                <div class="imagen-item-nueva existente" id="${imagenId}">
                    <div class="imagen-preview-container">
                        <img src="${rutaImagen}" class="imagen-preview-nueva" alt="Imagen existente"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2VuPC90ZXh0Pjwvc3ZnPg=='">
                        <div class="imagen-overlay">
                            <button type="button" onclick="marcarImagenExistenteParaEliminar(${imagen.idImagen || 0}, '${imagenId}')" 
                                    class="btn-eliminar-overlay">
                                🗑️
                            </button>
                        </div>
                        <div class="badge-existente">EXISTENTE</div>
                    </div>
                    <div class="imagen-info-nueva">
                        <div class="imagen-nombre">Imagen ${index + 1}</div>
                        <div class="imagen-tamano">Existente</div>
                    </div>
                </div>
            `;

            vistaPrevia.insertAdjacentHTML('beforeend', imagenHTML);

            imagenesExistentes.push({
                id: imagenId,
                idImagen: imagen.idImagen || 0,
                rutaImagen: rutaImagen,
                elemento: document.getElementById(imagenId)
            });
        });

        console.log(`✅ ${imagenesExistentes.length} imágenes existentes cargadas`);

    } catch (error) {
        console.error('❌ Error al cargar imágenes existentes:', error);
        mostrarMensajeAdmin('⚠️ No se pudieron cargar las imágenes existentes', 'warning');
    }
}

function marcarImagenExistenteParaEliminar(idImagen, imagenId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
    }

    if (!imagenesAEliminar.includes(idImagen)) {
        imagenesAEliminar.push(idImagen);
    }

    const imagenElement = document.getElementById(imagenId);
    if (imagenElement) {
        imagenElement.classList.add('imagen-marcada-eliminar');

        const btnEliminar = imagenElement.querySelector('.btn-eliminar-overlay');
        if (btnEliminar) {
            btnEliminar.disabled = true;
            btnEliminar.textContent = '✅ Marcada';
            btnEliminar.style.background = '#27ae60';
        }
    }

    console.log(`📝 Imagen ${idImagen} marcada para eliminar`);
    mostrarMensajeAdmin('Imagen marcada para eliminar. Los cambios se aplicarán al guardar.', 'info');
}

async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        console.log(`🗑️ Eliminando producto ID: ${id}`);
        const token = localStorage.getItem('token') || localStorage.getItem('jwtToken');

        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`${window.API_PRODUCTOS}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status} al eliminar producto`);
        }

        console.log('✅ Producto eliminado exitosamente');
        mostrarMensajeAdmin('✅ Producto eliminado exitosamente', 'success');

        if (productosDestacadosIdsAdmin.includes(id)) {
            productosDestacadosIdsAdmin = productosDestacadosIdsAdmin.filter(productoId => productoId !== id);
            guardarProductosDestacados();
        }

        await cargarProductosAdmin();

    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        mostrarMensajeAdmin('❌ Error al eliminar producto: ' + error.message, 'error');
    }
}

function resetearFormularioAdmin() {
    console.log('🧹 Reseteando formulario admin...');

    const form = document.getElementById('form-producto');
    if (form) form.reset();

    document.getElementById('producto-id').value = '';

    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.disabled = false;
        nombreInput.style.background = '';
        nombreInput.style.cursor = '';
    }

    const selectCategoria = document.getElementById('categoria');
    if (selectCategoria) {
        selectCategoria.disabled = false;
        selectCategoria.style.background = '';
        selectCategoria.style.cursor = '';
    }

    const selectSubcategoria = document.getElementById('subcategoria');
    if (selectSubcategoria) {
        selectSubcategoria.disabled = true;
        selectSubcategoria.style.background = '';
        selectSubcategoria.style.cursor = '';
        selectSubcategoria.innerHTML = '<option value="">Primero selecciona una categoría</option>';
    }

    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.innerHTML = '➕ Agregar Producto';
    }

    editandoProducto = false;

    // SOLO limpiar arrays, NO recrear la sección completa
    limpiarArraysImagenes();

    console.log('✅ Formulario reseteado');
}

function limpiarArraysImagenes() {
    console.log('🧹 Limpiando arrays de imágenes...');

    // Liberar URLs de objetos
    imagenesProducto.forEach(imagen => {
        if (imagen.objectUrl) {
            URL.revokeObjectURL(imagen.objectUrl);
        }
    });

    // Limpiar arrays
    imagenesProducto = [];
    imagenesExistentes = [];
    imagenesAEliminar = [];

    // Actualizar vista
    actualizarVistaPreviaImagenes();
    actualizarContadorImagenes();

    console.log('✅ Arrays de imágenes limpiados');
}

function actualizarVistaPreviaImagenes() {
    const vistaPrevia = document.getElementById('vista-previa-imagenes');
    if (!vistaPrevia) return;

    const totalImagenes = imagenesProducto.length + imagenesExistentes.length;

    if (totalImagenes === 0) {
        vistaPrevia.innerHTML = `
            <div class="empty-state">
                <div>🖼️</div>
                <p>No hay imágenes seleccionadas</p>
                <small>Se usará imagen por defecto si no agregas imágenes</small>
            </div>
        `;
    }
}

// =============================================
// INICIALIZACIÓN
// =============================================

function inicializarPanelAdmin() {
    console.log('🚀 Inicializando panel de administración...');

    cargarProductosDestacados();
    cargarCategoriasAdmin();
    cargarProductosAdmin();

    const formProducto = document.getElementById('form-producto');
    if (formProducto) formProducto.addEventListener('submit', gestionarProducto);

    const selectCategoria = document.getElementById('categoria');
    if (selectCategoria) {
        selectCategoria.addEventListener('change', function () {
            cargarSubcategoriasAdmin(this.value);
        });
    }

    configurarBusquedaConEnter();

    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // INICIALIZAR SECCIÓN DE IMÁGENES
    console.log('🖼️ Inicializando sistema de imágenes...');
    crearSeccionImagenes();

    console.log('✅ Panel de administración inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM cargado - inicializando admin...');
    inicializarPanelAdmin();
});