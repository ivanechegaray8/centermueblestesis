// VALIDACIONES
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validarPassword(password) {
    return password.length >= 6;
}

function validarNombreCompleto(nombreCompleto) {
    if (!nombreCompleto || nombreCompleto.trim().length === 0) {
        return 'El nombre completo es requerido';
    } else if (nombreCompleto.trim().length < 2) {
        return 'El nombre completo debe tener al menos 2 caracteres';
    }
    return null;
}

function validarTelefono(telefono) {
    if (!telefono || telefono.trim().length === 0) {
        return 'El teléfono es requerido';
    }
    const telefonoLimpio = telefono.replace(/\s/g, '');
    if (!/^\d{10}$/.test(telefonoLimpio)) {
        return 'El teléfono debe tener exactamente 10 dígitos';
    }
    return null;
}

function validarDireccion(direccion) {
    if (!direccion || direccion.trim().length === 0) {
        return 'La dirección es requerida';
    } else if (direccion.trim().length < 5) {
        return 'La dirección debe tener al menos 5 caracteres';
    }
    return null;
}

function validarCodigoPostal(codigoPostal) {
    if (!codigoPostal || codigoPostal.trim().length === 0) {
        return 'El código postal es requerido';
    }
    const cpLimpio = codigoPostal.replace(/\s/g, '');
    if (!/^\d{4}$/.test(cpLimpio)) {
        return 'El código postal debe tener exactamente 4 dígitos';
    }
    return null;
}