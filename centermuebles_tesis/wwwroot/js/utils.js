// FUNCIONES UTILITARIAS
function formatearPrecio(precio) {
    if (typeof precio !== 'number') {
        precio = parseFloat(precio) || 0;
    }
    return precio.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function obtenerImagenProducto(producto) {
    const imagenes = producto.Imagenes || producto.imagenes || [];
    if (imagenes.length > 0) {
        const img = imagenes[0];
        const ruta = img.rutaImagen || img.RutaImagen || img.url;
        if (ruta && ruta.trim() !== '') {
            return ruta;
        }
    }
    return '';
}

function obtenerProductosPagina(productos, pagina) {
    const inicio = (pagina - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    return productos.slice(inicio, fin);
}

function limpiarMensajesError() {
    const errores = document.querySelectorAll('.error-message');
    errores.forEach(error => {
        error.textContent = '';
        error.classList.remove('show');
    });

    const inputs = document.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));
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
    } else {
        console.warn(`No se encontró el elemento mensaje-${tipo}`);
        if (clase === 'error') {
            alert(texto);
        }
    }
}
// FUNCIONES DE CATEGORÍAS (agregar al final de utils.js)
function obtenerCategoriaDesdeSubcategoria(idSubcategoria) {
    const mapeoSubcategoriaACategoria = {
        1: 1, 2: 1, 4: 1,
        5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2,
        15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 2, 21: 2, 22: 2, 23: 2,
        24: 3, 25: 3, 26: 3,
        27: 4, 28: 4, 29: 4,
        30: 5, 31: 5, 32: 5,
        33: 6, 34: 6, 35: 6,
        36: 7, 37: 7, 38: 7
    };

    return mapeoSubcategoriaACategoria[idSubcategoria] || null;
}

function filtrarProductosPorCategoria(productos, categoria) {
    console.log(`🔍 Filtrando categoría: ${categoria}`);

    const mapeoCategoriasIds = {
        'electrodomesticos': 1,
        'muebles': 2,
        'colchonesysommiers': 3,
        'tecnologia': 4,
        'climatizacion': 5,
        'airelibre': 6,
        'cocinasytermotanques': 7
    };

    const idCategoria = mapeoCategoriasIds[categoria];

    if (!idCategoria) {
        console.log(`❌ Categoría no encontrada: ${categoria}`);
        return [];
    }

    return productos.filter(producto => {
        const productoIdSubcategoria = producto.IdSubcategoria || producto.idSubcategoria;

        if (!productoIdSubcategoria) {
            console.log(`❌ Producto sin IdSubcategoria: ${producto.nombre}`);
            return false;
        }

        const categoriaProducto = obtenerCategoriaDesdeSubcategoria(productoIdSubcategoria);
        return categoriaProducto === idCategoria;
    });
}
function filtrarProductosPorSubcategoria(productos, categoria, subcategoria) {
    console.log(`🔍 Filtrando subcategoría: ${categoria}/${subcategoria}`);

    const mapeoSubcategoriasIds = {
        'heladeras': 1, 'lavarropas': 2, 'pequenos': 4,
        'alacenas': 5, 'cajoneras': 6, 'aparadores': 7, 'bibliotecas': 8,
        'camas-1-plaza': 9, 'camas-2-plazas': 10, 'comodas': 11, 'cunas': 12,
        'despenseros': 13, 'escritorios': 14, 'mesas-ratonas': 15, 'mesas-luz': 16,
        'muebles-tv': 17, 'placares-corredizas': 18, 'placares-abrir': 19,
        'zapateros': 20, 'vajilleros': 21, 'muebles-bano': 22, 'muebles-cocina': 23,
        '1-plaza': 24, '2-plazas': 25, 'sommier': 26,
        'celulares': 27, 'audio': 28, 'tv': 29,
        'aires': 30, 'estufas': 31, 'ventiladores': 32,
        'jardin': 33, 'parrillas': 34, 'sombrillas': 35,
        'cocinas-gas': 36, 'cocinas-electricas': 37, 'termotanques': 38
    };

    const idSubcategoria = mapeoSubcategoriasIds[subcategoria];

    if (!idSubcategoria) {
        console.log(`❌ Subcategoría no encontrada: ${subcategoria}`);
        return [];
    }

    return productos.filter(producto => {
        const productoIdSubcategoria = producto.IdSubcategoria || producto.idSubcategoria;
        return productoIdSubcategoria === idSubcategoria;
    });
}