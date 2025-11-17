// SISTEMA DE BÚSQUEDA
function inicializarBuscador() {
    const searchInput = document.getElementById('search-input');
    const searchSuggestions = document.getElementById('search-suggestions');

    if (!searchInput || !searchSuggestions) return;

    searchInput.addEventListener('blur', function () {
        setTimeout(() => {
            searchSuggestions.style.display = 'none';
        }, 200);
    });

    searchInput.addEventListener('input', function (e) {
        const termino = e.target.value.trim();

        if (termino.length < 2) {
            searchSuggestions.style.display = 'none';
            return;
        }

        buscarProductos(termino);
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            realizarBusqueda(this.value.trim());
            searchSuggestions.style.display = 'none';
        }
    });

    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
            searchSuggestions.style.display = 'none';
        }
    });
}

function buscarProductos(termino) {
    if (productosGlobales.length === 0) return;

    const resultados = productosGlobales.filter(producto =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase())) ||
        (producto.categoria && producto.categoria.toLowerCase().includes(termino.toLowerCase())) ||
        (producto.subcategoria && producto.subcategoria.toLowerCase().includes(termino.toLowerCase()))
    ).slice(0, 8);

    mostrarSugerencias(resultados, termino);
}

function mostrarSugerencias(productos, termino) {
    const searchSuggestions = document.getElementById('search-suggestions');

    if (productos.length === 0) {
        searchSuggestions.innerHTML = '<div class="search-suggestion-item">No se encontraron productos</div>';
    } else {
        searchSuggestions.innerHTML = productos.map(producto => `
            <div class="search-suggestion-item" onclick="seleccionarProductoBusqueda(${producto.idProducto || producto.id})">
                <div class="search-suggestion-name">${resaltarCoincidencia(producto.nombre, termino)}</div>
                <div class="search-suggestion-category">${obtenerNombreCategoriaProducto(producto)}</div>
            </div>
        `).join('');
    }

    searchSuggestions.style.display = 'block';
}

function obtenerNombreCategoriaProducto(producto) {
    const productoIdSubcategoria = producto.IdSubcategoria || producto.idSubcategoria;

    const mapeoSubcategorias = {
        1: 'Heladeras', 2: 'Lavarropas', 4: 'Electrodomésticos Pequeños',
        5: 'Alacenas', 6: 'Cajoneras', 7: 'Aparadores', 8: 'Bibliotecas',
        9: 'Camas 1 Plaza', 10: 'Camas 2 Plazas', 11: 'Cómodas', 12: 'Cunas',
        13: 'Despenseros', 14: 'Escritorios', 15: 'Mesas Ratonas', 16: 'Mesas de Luz',
        17: 'Muebles TV', 18: 'Placares Corredizos', 19: 'Placares de Abrir',
        20: 'Zapateros', 21: 'Vajilleros', 22: 'Muebles Baño', 23: 'Muebles Cocina',
        24: 'Colchones 1 Plaza', 25: 'Colchones 2 Plazas', 26: 'Sommiers',
        27: 'Celulares', 28: 'Audio', 29: 'TV',
        30: 'Aires Acondicionados', 31: 'Estufas', 32: 'Ventiladores',
        33: 'Jardín', 34: 'Parrillas', 35: 'Sombrillas',
        36: 'Cocinas Gas', 37: 'Cocinas Eléctricas', 38: 'Termotanques'
    };

    return mapeoSubcategorias[productoIdSubcategoria] || 'Producto';
}

function resaltarCoincidencia(texto, termino) {
    const regex = new RegExp(`(${termino})`, 'gi');
    return texto.replace(regex, '<strong>$1</strong>');
}

function seleccionarProductoBusqueda(idProducto) {
    const producto = productosGlobales.find(p => (p.idProducto || p.id) === idProducto);
    if (producto) {
        verDetalleProducto(idProducto);
    }
    document.getElementById('search-suggestions').style.display = 'none';
}

function realizarBusqueda(termino) {
    if (!termino.trim()) {
        cargarPaginaPrincipal();
        return;
    }

    modoActual = 'busqueda';
    terminoBusqueda = termino;
    categoriaActual = '';
    subcategoriaActual = '';
    paginaActual = 1;

    cargarResultadosBusqueda(termino);
}

async function cargarResultadosBusqueda(termino) {
    try {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="loading">Buscando productos...</div>';

        if (productosGlobales.length === 0) {
            const response = await fetch(API_PRODUCTOS);
            productosGlobales = await response.json();
        }

        productosFiltrados = productosGlobales.filter(producto =>
            producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
            (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase())) ||
            (producto.categoria && producto.categoria.toLowerCase().includes(termino.toLowerCase())) ||
            (producto.subcategoria && producto.subcategoria.toLowerCase().includes(termino.toLowerCase()))
        );

        const productosPorCategoria = agruparProductosPorCategoria(productosFiltrados);
        const productosPagina = obtenerProductosPagina(productosFiltrados, paginaActual);
        const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

        const html = `
            <div class="seccion-contenido">
                <h1>Resultados de búsqueda</h1>
                <p class="subtitulo">${productosFiltrados.length} productos encontrados para "${termino}"</p>

                ${Object.keys(productosPorCategoria).length > 1 ? generarFiltrosCategoria(productosPorCategoria, termino) : ''}

                <div class="products-grid">
                    ${generarHTMLProductos(productosPagina)}
                </div>

                ${generarPaginacion(totalPaginas)}
            </div>
        `;

        document.getElementById('contenido-dinamico').innerHTML = html;
        document.getElementById('search-suggestions').style.display = 'none';

    } catch (error) {
        console.error('Error en búsqueda:', error);
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al realizar la búsqueda</div>';
    }
}
// FUNCIONES AUXILIARES DE BÚSQUEDA (agregar al final de search.js)
function agruparProductosPorCategoria(productos) {
    const categorias = {};

    productos.forEach(producto => {
        const productoIdSubcategoria = producto.IdSubcategoria || producto.idSubcategoria;
        const idCategoria = obtenerCategoriaDesdeSubcategoria(productoIdSubcategoria);

        if (idCategoria) {
            const nombreCategoria = obtenerNombreCategoriaPorId(idCategoria);
            if (!categorias[nombreCategoria]) {
                categorias[nombreCategoria] = [];
            }
            categorias[nombreCategoria].push(producto);
        }
    });

    return categorias;
}

function obtenerNombreCategoriaPorId(idCategoria) {
    const categorias = {
        1: 'Electrodomésticos',
        2: 'Muebles',
        3: 'Colchones y Sommiers',
        4: 'Tecnología',
        5: 'Climatización',
        6: 'Aire Libre',
        7: 'Cocinas y Termotanques'
    };
    return categorias[idCategoria] || 'Otra Categoría';
}

function generarFiltrosCategoria(productosPorCategoria, termino) {
    let html = '<div class="filtros-categoria">';
    html += '<h3>Filtrar por categoría:</h3>';
    html += '<div class="categorias-filtro">';

    Object.keys(productosPorCategoria).forEach(categoria => {
        const cantidad = productosPorCategoria[categoria].length;
        html += `
            <button class="filtro-categoria-btn" onclick="filtrarBusquedaPorCategoria('${categoria}', '${termino}')">
                ${categoria} (${cantidad})
            </button>
        `;
    });

    html += '</div></div>';
    return html;
}

function filtrarBusquedaPorCategoria(nombreCategoria, termino) {
    let productosBusqueda = productosGlobales.filter(producto =>
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(termino.toLowerCase()))
    );

    productosFiltrados = productosBusqueda.filter(producto => {
        const productoIdSubcategoria = producto.IdSubcategoria || producto.idSubcategoria;
        const idCategoria = obtenerCategoriaDesdeSubcategoria(productoIdSubcategoria);
        const categoriaProducto = obtenerNombreCategoriaPorId(idCategoria);

        return categoriaProducto === nombreCategoria;
    });

    paginaActual = 1;

    const productosPagina = obtenerProductosPagina(productosFiltrados, paginaActual);
    const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

    const html = `
        <div class="seccion-contenido">
            <h1>${nombreCategoria} - Resultados para "${termino}"</h1>
            <p class="subtitulo">${productosFiltrados.length} productos encontrados</p>

            <div class="products-grid">
                ${generarHTMLProductos(productosPagina)}
            </div>

            ${generarPaginacion(totalPaginas)}
        </div>
    `;

    document.getElementById('contenido-dinamico').innerHTML = html;
}