// FUNCIONES PRINCIPALES Y CATEGORÍAS
async function cargarPaginaPrincipal() {
    modoActual = 'principal';
    categoriaActual = '';
    subcategoriaActual = '';
    terminoBusqueda = '';
    paginaActual = 1;

    try {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="loading">Cargando página principal...</div>';

        if (productosGlobales.length === 0) {
            const response = await fetch(API_PRODUCTOS);
            productosGlobales = await response.json();
            console.log(`✅ ${productosGlobales.length} productos cargados globalmente`);
        }

        try {
            const response = await fetch('secciones/principal.html');
            if (response.ok) {
                const html = await response.text();
                document.getElementById('contenido-dinamico').innerHTML = html;
                await cargarProductosDestacados();
                return;
            }
        } catch (error) {
            console.log('No se pudo cargar principal.html, usando fallback');
        }

        await generarContenidoPrincipal();

    } catch (error) {
        console.error('Error cargando página principal:', error);
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al cargar la página principal</div>';
    }
}

async function cargarProductosDestacados() {
    try {
        productosDestacadosIds = JSON.parse(localStorage.getItem('productosDestacados')) || [];
        const productosDestacados = productosGlobales.filter(producto =>
            productosDestacadosIds.includes(producto.idProducto || producto.id)
        );

        const productsGrid = document.querySelector('.products-grid');
        const featuredProducts = document.querySelector('.featured-products');
        const contenedor = productsGrid || featuredProducts;

        if (contenedor) {
            if (productosDestacados.length > 0) {
                contenedor.innerHTML = generarHTMLProductos(productosDestacados);
            } else {
                contenedor.innerHTML = `
                    <div class="empty-state">
                        <h3>📭 No hay productos destacados</h3>
                        <p>Actualmente no hay productos marcados como destacados.</p>
                        <p>Visita nuestras categorías para ver todos los productos disponibles.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error cargando productos destacados:', error);
    }
}

async function generarContenidoPrincipal() {
    productosDestacadosIds = JSON.parse(localStorage.getItem('productosDestacados')) || [];
    const productosDestacados = productosGlobales.filter(producto =>
        productosDestacadosIds.includes(producto.idProducto || producto.id)
    );

    const html = `
        <div class="seccion-contenido">
            <h1>Bienvenido a Centermuebles</h1>
            <p class="subtitulo">Encuentra los mejores productos para tu hogar</p>

            <section class="productos-destacados">
                <h2>⭐ Productos Destacados</h2>
                <div class="products-grid" id="featured-products">
                    ${productosDestacados.length > 0 ?
            generarHTMLProductos(productosDestacados) :
            `
                        <div class="empty-state">
                            <h3>📭 No hay productos destacados</h3>
                            <p>Actualmente no hay productos marcados como destacados.</p>
                            <p>Visita nuestras categorías para ver todos los productos disponibles.</p>
                        </div>
                        `
        }
                </div>
            </section>

            <section class="categorias-destacadas">
                <h2>🏷️ Nuestras Categorías</h2>
                <div class="categorias-grid">
                    <div class="categoria-card" onclick="cargarCategoria('colchonesysommiers')">
                        <h3>🛏️ Colchones y Sommiers</h3>
                        <p>Encuentra el descanso perfecto para tus noches</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('electrodomesticos')">
                        <h3>🔌 Electrodomésticos</h3>
                        <p>Moderniza y facilita las tareas de tu hogar</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('tecnologia')">
                        <h3>📱 Tecnología</h3>
                        <p>Lo último en electrónica y entretenimiento</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('climatizacion')">
                        <h3>❄️ Climatización</h3>
                        <p>Mantén tu hogar a la temperatura ideal</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('muebles')">
                        <h3>🪑 Muebles</h3>
                        <p>Amuebla y decora todos tus espacios</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('airelibre')">
                        <h3>🌳 Aire Libre</h3>
                        <p>Disfruta de tu jardín y espacios exteriores</p>
                    </div>
                    <div class="categoria-card" onclick="cargarCategoria('cocinasytermotanques')">
                        <h3>🍳 Cocinas y Termotanques</h3>
                        <p>Todo para tu cocina y agua caliente</p>
                    </div>
                </div>
            </section>
        </div>
    `;

    document.getElementById('contenido-dinamico').innerHTML = html;
}
// FUNCIONES DE CATEGORÍAS (agregar al final de main.js)
async function cargarProductosCategoria(categoria) {
    try {
        if (productosGlobales.length === 0) {
            const response = await fetch(API_PRODUCTOS);
            productosGlobales = await response.json();
        }

        productosFiltrados = filtrarProductosPorCategoria(productosGlobales, categoria);

        const tituloCategoria = obtenerTituloCategoria(categoria);
        const productosPagina = obtenerProductosPagina(productosFiltrados, paginaActual);
        const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

        const html = `
            <div class="seccion-contenido">
                <h1>${tituloCategoria}</h1>
                <p class="subtitulo">${productosFiltrados.length} productos encontrados</p>

                <div class="products-grid">
                    ${generarHTMLProductos(productosPagina)}
                </div>

                ${generarPaginacion(totalPaginas)}
            </div>
        `;

        document.getElementById('contenido-dinamico').innerHTML = html;

    } catch (error) {
        console.error('Error cargando productos de categoría:', error);
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al cargar los productos</div>';
    }
}

async function cargarProductosSubcategoria(categoria, subcategoria) {
    try {
        if (productosGlobales.length === 0) {
            const response = await fetch(API_PRODUCTOS);
            productosGlobales = await response.json();
        }

        productosFiltrados = filtrarProductosPorSubcategoria(productosGlobales, categoria, subcategoria);

        const tituloSubcategoria = obtenerTituloSubcategoria(subcategoria);
        const productosPagina = obtenerProductosPagina(productosFiltrados, paginaActual);
        const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

        const html = `
            <div class="seccion-contenido">
                <h1>${tituloSubcategoria}</h1>
                <p class="subtitulo">${productosFiltrados.length} productos encontrados en ${tituloSubcategoria}</p>

                <div class="products-grid">
                    ${generarHTMLProductos(productosPagina)}
                </div>

                ${generarPaginacion(totalPaginas)}
            </div>
        `;

        document.getElementById('contenido-dinamico').innerHTML = html;

    } catch (error) {
        console.error('Error cargando productos de subcategoría:', error);
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al cargar los productos</div>';
    }
}

function obtenerTituloCategoria(categoria) {
    const titulos = {
        'colchonesysommiers': 'Colchones y Sommiers',
        'electrodomesticos': 'Electrodomésticos',
        'tecnologia': 'Tecnología',
        'climatizacion': 'Climatización',
        'muebles': 'Muebles',
        'airelibre': 'Aire Libre',
        'cocinasytermotanques': 'Cocinas y Termotanques'
    };
    return titulos[categoria] || categoria;
}

function obtenerTituloSubcategoria(subcategoria) {
    const titulos = {
        '1-plaza': 'Colchones 1 Plaza',
        '2-plazas': 'Colchones 2 Plazas',
        'sommier': 'Sommiers',
        'heladeras': 'Heladeras y Freezers',
        'lavarropas': 'Lavarropas',
        'pequenos': 'Electrodomésticos Pequeños',
        'celulares': 'Celulares',
        'audio': 'Audio',
        'tv': 'Televisores',
        'aires': 'Aires Acondicionados',
        'estufas': 'Estufas',
        'ventiladores': 'Ventiladores',
        'alacenas': 'Alacenas y Bajomesadas',
        'cajoneras': 'Cajoneras',
        'aparadores': 'Aparadores',
        'bibliotecas': 'Bibliotecas',
        'camas-1-plaza': 'Camas 1 Plaza',
        'camas-2-plazas': 'Camas 2 Plazas',
        'comodas': 'Cómodas',
        'cunas': 'Cunas',
        'despenseros': 'Despenseros',
        'escritorios': 'Escritorios',
        'mesas-ratonas': 'Mesas Ratonas',
        'mesas-luz': 'Mesas de Luz',
        'muebles-tv': 'Muebles para TV',
        'placares-corredizas': 'Placares Corredizos',
        'placares-abrir': 'Placares de Abrir',
        'zapateros': 'Zapateros',
        'vajilleros': 'Vajilleros',
        'muebles-bano': 'Muebles de Baño',
        'muebles-cocina': 'Muebles de Cocina',
        'jardin': 'Juegos de Jardín',
        'parrillas': 'Parrillas',
        'sombrillas': 'Sombrillas y Gazebos',
        'cocinas-gas': 'Cocinas a Gas',
        'cocinas-electricas': 'Cocinas Eléctricas',
        'termotanques': 'Termotanques'
    };
    return titulos[subcategoria] || subcategoria;
}
// FUNCIONES PARA LAS CATEGORÍAS DEL MENÚ
function cargarCategoria(categoria) {
    modoActual = 'categoria';
    categoriaActual = categoria;
    subcategoriaActual = '';
    paginaActual = 1;

    try {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="loading">Cargando categoría...</div>';
        cargarProductosCategoria(categoria);
    } catch (error) {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al cargar la categoría</div>';
    }
}

function cargarSubcategoria(categoria, subcategoria) {
    modoActual = 'subcategoria';
    categoriaActual = categoria;
    subcategoriaActual = subcategoria;
    paginaActual = 1;

    try {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="loading">Cargando subcategoría...</div>';
        cargarProductosSubcategoria(categoria, subcategoria);
    } catch (error) {
        document.getElementById('contenido-dinamico').innerHTML = '<div class="error">Error al cargar la subcategoría</div>';
    }
}