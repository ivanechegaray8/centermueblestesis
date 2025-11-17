// CARRITO
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('carrito')) || [];
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.style.display = 'inline';
        } else {
            cartCount.style.display = 'none';
        }
    }
}

function agregarAlCarrito(producto) {
    const carrito = obtenerCarrito();
    const existente = carrito.find(item => item.id === (producto.idProducto || producto.id));

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.idProducto || producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: obtenerImagenProducto(producto),
            cantidad: 1
        });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
    alert('✅ Producto agregado al carrito');
}