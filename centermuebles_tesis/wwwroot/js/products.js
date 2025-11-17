// MANEJO DE PRODUCTOS
function generarHTMLProductos(productos) {
    if (productos.length === 0) {
        return '<div class="empty-state">No se encontraron productos en esta categoría</div>';
    }

    return productos.map(producto => {
        const esDestacado = productosDestacadosIds.includes(producto.idProducto || producto.id);
        const imagenUrl = obtenerImagenProducto(producto);
        const tieneImagenReal = tieneImagenRealProducto(producto);

        return `
            <div class="product-card">
                <div class="product-image">
                    ${tieneImagenReal && imagenUrl ?
                `<img src="${imagenUrl}" alt="${producto.nombre}"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                         <div class="no-image" style="display: none">No Foto</div>` :
                `<div class="no-image">No Foto</div>`
            }
                    ${esDestacado ? '<div class="producto-destacado-badge">⭐ Destacado</div>' : ''}
                    ${producto.stock <= 0 ? '<div class="out-of-stock">Agotado</div>' : ''}
                </div>
                <div class="product-info">
                    <h3>${producto.nombre}</h3>
                    <p class="product-price">$${formatearPrecio(producto.precio)}</p>
                    <p class="product-stock">Stock: ${producto.stock}</p>
                    <button class="btn-detalle" onclick="verDetalleProducto(${producto.idProducto || producto.id})">📖 Ver Detalle</button>
                </div>
            </div>
        `;
    }).join('');
}

// FUNCIÓN CORREGIDA PARA OBTENER IMÁGENES
function obtenerImagenProducto(producto) {
    // Si no hay ruta de imagen, retorna null
    if (!producto.rutaImagen) {
        return null;
    }

    // Si la ruta ya es una URL completa, úsala directamente
    if (producto.rutaImagen.startsWith('http')) {
        return producto.rutaImagen;
    }

    // Si es una ruta relativa, conviértela en URL completa
    // Asegúrate de que la ruta empiece con /
    let rutaImagen = producto.rutaImagen;
    if (!rutaImagen.startsWith('/')) {
        rutaImagen = '/' + rutaImagen;
    }

    return `http://localhost:5269${rutaImagen}`;
}

// NUEVA FUNCIÓN PARA DETECTAR SI TIENE IMAGEN REAL
function tieneImagenRealProducto(producto) {
    // Si no hay ruta de imagen, no tiene imagen
    if (!producto.rutaImagen) {
        return false;
    }

    // Lista de rutas que se consideran imágenes por defecto/sin foto
    const rutasPorDefecto = [
        '/images/productos/sinfoto.png',
        '/images/productos/default.jpg',
        '/img/placeholder.jpg',
        'sinfoto.png',
        'default.jpg',
        'placeholder.jpg'
    ];

    // Verificar si la ruta es una de las imágenes por defecto
    const rutaImagenLower = producto.rutaImagen.toLowerCase();
    const esImagenPorDefecto = rutasPorDefecto.some(ruta =>
        rutaImagenLower.includes(ruta.toLowerCase())
    );

    // Si es imagen por defecto, no cuenta como imagen real
    if (esImagenPorDefecto) {
        return false;
    }

    // Verificar si tiene imágenes en arrays adicionales
    const tieneImagenesArray = (producto.Imagenes && Array.isArray(producto.Imagenes) && producto.Imagenes.length > 0) ||
        (producto.imagenes && Array.isArray(producto.imagenes) && producto.imagenes.length > 0);

    // Si tiene imágenes en arrays, cuenta como imagen real
    if (tieneImagenesArray) {
        return true;
    }

    // Si la ruta de imagen existe y no es por defecto, cuenta como imagen real
    return true;
}

function verDetalleProducto(id) {
    window.location.href = `detalle-producto.html?id=${id}`;
}

function generarPaginacion(totalPaginas) {
    if (totalPaginas <= 1) return '';

    let paginacionHTML = '<div class="pagination">';

    paginacionHTML += `<button onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>`;

    for (let i = 1; i <= totalPaginas; i++) {
        if (i === paginaActual) {
            paginacionHTML += `<button class="active">${i}</button>`;
        } else {
            paginacionHTML += `<button onclick="cambiarPagina(${i})">${i}</button>`;
        }
    }

    paginacionHTML += `<button onclick="cambiarPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>`;

    paginacionHTML += '</div>';
    return paginacionHTML;
}

function cambiarPagina(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= Math.ceil(productosFiltrados.length / productosPorPagina)) {
        paginaActual = nuevaPagina;

        switch (modoActual) {
            case 'categoria':
                cargarProductosCategoria(categoriaActual);
                break;
            case 'subcategoria':
                cargarProductosSubcategoria(categoriaActual, subcategoriaActual);
                break;
            case 'busqueda':
                cargarResultadosBusqueda(terminoBusqueda);
                break;
            default:
                cargarPaginaPrincipal();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// FUNCIÓN PARA FORMATEAR PRECIO
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR').format(precio);
}