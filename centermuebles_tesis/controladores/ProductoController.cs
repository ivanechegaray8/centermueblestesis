using Microsoft.AspNetCore.Mvc;
using centermuebles_tesis.modelos;
using Microsoft.EntityFrameworkCore;

namespace centermuebles_tesis.controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly CentermueblesContext _context;

        public ProductosController(CentermueblesContext context)
        {
            _context = context;
        }

        // GET: api/productos → devuelve todos los productos CON SUS RELACIONES
        [HttpGet]
        public IActionResult ObtenerProductos()
        {
            var productos = _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .ToList();

            return Ok(productos);
        }

        // GET: api/productos/7 → devuelve el producto con IdProducto = 7
        [HttpGet("{id}")]
        public IActionResult ObtenerProductoPorId(int id)
        {
            var producto = _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .FirstOrDefault(p => p.IdProducto == id);

            if (producto == null)
            {
                return NotFound($"No se encontró un producto con ID {id}");
            }

            return Ok(producto);
        }

        // GET: api/productos/categoria/2 → productos por categoría
        [HttpGet("categoria/{idCategoria}")]
        public IActionResult ObtenerProductosPorCategoria(int idCategoria)
        {
            var productos = _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                .Where(p => p.IdSubcategoriaNavigation.IdCategoria == idCategoria)
                .ToList();

            return Ok(productos);
        }

        // GET: api/productos/subcategoria/3 → productos por subcategoría
        [HttpGet("subcategoria/{idSubcategoria}")]
        public IActionResult ObtenerProductosPorSubcategoria(int idSubcategoria)
        {
            var productos = _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                .Where(p => p.IdSubcategoria == idSubcategoria)
                .ToList();

            return Ok(productos);
        }

        // POST: api/productos → guarda un nuevo producto (OPCIÓN 3 IMPLEMENTADA)
        [HttpPost]
        public IActionResult CrearProducto([FromBody] Producto nuevoProducto)
        {
            try
            {
                // Validaciones básicas
                if (string.IsNullOrEmpty(nuevoProducto.Nombre))
                    return BadRequest("El nombre del producto es requerido");

                if (nuevoProducto.Precio <= 0)
                    return BadRequest("El precio debe ser mayor a 0");

                if (nuevoProducto.IdSubcategoria <= 0)
                    return BadRequest("La subcategoría es requerida");

                //VERIFICAR MÁS DETALLADAMENTE LA SUBCATEGORÍA
                var subcategoria = _context.Subcategorias
                    .FirstOrDefault(s => s.IdSubcategoria == nuevoProducto.IdSubcategoria);

                if (subcategoria == null)
                    return BadRequest($"No existe la subcategoría con ID {nuevoProducto.IdSubcategoria}");

                //ASEGURAR VALORES POR DEFECTO
                if (nuevoProducto.Stock < 0)
                    nuevoProducto.Stock = 0;

                if (string.IsNullOrEmpty(nuevoProducto.Descripcion))
                    nuevoProducto.Descripcion = "Sin descripción";

                // ✅ LIMPIAR PROPIEDADES DE NAVEGACIÓN (por si acaso)
               // nuevoProducto.IdSubcategoriaNavigation = null;
                //nuevoProducto.DetalleVentas = null;
                //nuevoProducto.CarritoCompras = null;
                //nuevoProducto.Venta = null;

                _context.Productos.Add(nuevoProducto);
                _context.SaveChanges();

                return Ok(new
                {
                    mensaje = "Producto creado exitosamente",
                    id = nuevoProducto.IdProducto,
                    nombre = nuevoProducto.Nombre
                });
            }
            catch (DbUpdateException dbEx)
            {
                // ✅ ERROR ESPECÍFICO DE BASE DE DATOS
                var errorMessage = $"Error de base de datos: {dbEx.Message}";
                if (dbEx.InnerException != null)
                {
                    errorMessage += $" | Detalles: {dbEx.InnerException.Message}";
                }
                return StatusCode(500, errorMessage);
            }
            catch (Exception ex)
            {
                // ✅ ERROR GENERAL
                var errorMessage = $"Error al crear el producto: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $" | Detalles: {ex.InnerException.Message}";
                }
                return StatusCode(500, errorMessage);
            }
        }

        // PUT: api/productos/7 → actualiza el producto (TAMBIÉN CORREGIDO)
        [HttpPut("{id}")]
        public IActionResult ActualizarProducto(int id, [FromBody] Producto productoActualizado)
        {
            try
            {
                var productoExistente = _context.Productos
                    .FirstOrDefault(p => p.IdProducto == id);

                if (productoExistente == null)
                {
                    return NotFound($"No se encontró un producto con ID {id}");
                }

                // ✅ OPCIÓN 3 TAMBIÉN PARA PUT
                productoActualizado.IdSubcategoriaNavigation = null;
                ModelState.Clear();

                // Validar subcategoría si se está actualizando
                if (productoActualizado.IdSubcategoria > 0)
                {
                    var subcategoriaExiste = _context.Subcategorias
                        .Any(s => s.IdSubcategoria == productoActualizado.IdSubcategoria);

                    if (!subcategoriaExiste)
                        return BadRequest("La subcategoría especificada no existe");
                }

                // Actualizar solo los campos proporcionados
                if (!string.IsNullOrEmpty(productoActualizado.Nombre))
                    productoExistente.Nombre = productoActualizado.Nombre;

                if (productoActualizado.Precio > 0)
                    productoExistente.Precio = productoActualizado.Precio;

                if (productoActualizado.IdSubcategoria > 0)
                    productoExistente.IdSubcategoria = productoActualizado.IdSubcategoria;

                if (!string.IsNullOrEmpty(productoActualizado.Descripcion))
                    productoExistente.Descripcion = productoActualizado.Descripcion;

                if (!string.IsNullOrEmpty(productoActualizado.RutaImagen))
                    productoExistente.RutaImagen = productoActualizado.RutaImagen;

                if (productoActualizado.Stock >= 0)
                    productoExistente.Stock = productoActualizado.Stock;

                _context.SaveChanges();

                return Ok(new { mensaje = $"Producto con ID {id} actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar el producto: {ex.Message}");
            }
        }

        // DELETE: api/productos/7 → borra el producto
        [HttpDelete("{id}")]
        public IActionResult EliminarProducto(int id)
        {
            try
            {
                var producto = _context.Productos
                    .FirstOrDefault(p => p.IdProducto == id);

                if (producto == null)
                {
                    return NotFound($"No se encontró un producto con ID {id}");
                }

                // Verificar si el producto está en algún carrito o venta
                var enCarrito = _context.CarritoCompras.Any(c => c.IdProducto == id);
                var enVentas = _context.DetalleVentas.Any(d => d.IdProducto == id);

                if (enCarrito || enVentas)
                {
                    return BadRequest("No se puede eliminar el producto porque está asociado a carritos o ventas existentes");
                }

                _context.Productos.Remove(producto);
                _context.SaveChanges();

                return Ok(new { mensaje = $"Producto '{producto.Nombre}' eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al eliminar el producto: {ex.Message}");
            }
        }
    }
}