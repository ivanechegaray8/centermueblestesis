using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using centermuebles_tesis.modelos;
using centermuebles_tesis.DTOs;

namespace centermuebles_tesis.controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductosController : ControllerBase
    {
        private readonly CentermueblesContext _context;
        private readonly IWebHostEnvironment _environment;
        private const string ImagenDefaultRelative = "/images/productos/sinfoto.png"; // ruta usada por el frontend

        public ProductosController(CentermueblesContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // =========================================
        // GET: api/productos
        // Devuelve todos los productos con DTOs e imágenes
        // =========================================
        [HttpGet]
        public async Task<IActionResult> ObtenerProductos()
        {
            var productos = await _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .Include(p => p.ImagenesProducto)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    IdSubcategoria = p.IdSubcategoria,
                    RutaImagen = string.IsNullOrEmpty(p.RutaImagen) ? ImagenDefaultRelative : p.RutaImagen,
                    NombreSubcategoria = p.IdSubcategoriaNavigation != null ? p.IdSubcategoriaNavigation.Nombre : null,
                    NombreCategoria = p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoriaNavigation != null
                        ? p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                        : null,
                    Imagenes = p.ImagenesProducto.Select(img => new ImagenProductoDTO
                    {
                        IdImagen = img.IdImagen,
                        RutaImagen = img.RutaImagen,
                        NombreArchivo = img.NombreArchivo,
                        ImagenPrincipal = img.ImagenPrincipal,
                        Orden = img.Orden
                    }).ToList()
                })
                .ToListAsync();

            return Ok(productos);
        }

        // =========================================
        // GET: api/productos/{id}
        // Obtener producto por id (con imágenes)
        // =========================================
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerProductoPorId(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .Include(p => p.ImagenesProducto)
                .Where(p => p.IdProducto == id)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    IdSubcategoria = p.IdSubcategoria,
                    RutaImagen = string.IsNullOrEmpty(p.RutaImagen) ? ImagenDefaultRelative : p.RutaImagen,
                    NombreSubcategoria = p.IdSubcategoriaNavigation != null ? p.IdSubcategoriaNavigation.Nombre : null,
                    NombreCategoria = p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoriaNavigation != null
                        ? p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                        : null,
                    Imagenes = p.ImagenesProducto.Select(img => new ImagenProductoDTO
                    {
                        IdImagen = img.IdImagen,
                        RutaImagen = img.RutaImagen,
                        NombreArchivo = img.NombreArchivo,
                        ImagenPrincipal = img.ImagenPrincipal,
                        Orden = img.Orden
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (producto == null)
                return NotFound($"No se encontró un producto con ID {id}");

            return Ok(producto);
        }

        // =========================================
        // GET: api/productos/categoria/{idCategoria}
        // Productos por categoría
        // =========================================
        [HttpGet("categoria/{idCategoria}")]
        public async Task<IActionResult> ObtenerProductosPorCategoria(int idCategoria)
        {
            var productos = await _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .Include(p => p.ImagenesProducto)
                .Where(p => p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoria == idCategoria)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    IdSubcategoria = p.IdSubcategoria,
                    RutaImagen = string.IsNullOrEmpty(p.RutaImagen) ? ImagenDefaultRelative : p.RutaImagen,
                    NombreSubcategoria = p.IdSubcategoriaNavigation != null ? p.IdSubcategoriaNavigation.Nombre : null,
                    NombreCategoria = p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoriaNavigation != null
                        ? p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                        : null,
                    Imagenes = p.ImagenesProducto.Select(img => new ImagenProductoDTO
                    {
                        IdImagen = img.IdImagen,
                        RutaImagen = img.RutaImagen,
                        NombreArchivo = img.NombreArchivo,
                        ImagenPrincipal = img.ImagenPrincipal,
                        Orden = img.Orden
                    }).ToList()
                })
                .ToListAsync();

            return Ok(productos);
        }

        // =========================================
        // GET: api/productos/subcategoria/{idSubcategoria}
        // Productos por subcategoría
        // =========================================
        [HttpGet("subcategoria/{idSubcategoria}")]
        public async Task<IActionResult> ObtenerProductosPorSubcategoria(int idSubcategoria)
        {
            var productos = await _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .Include(p => p.ImagenesProducto)
                .Where(p => p.IdSubcategoria == idSubcategoria)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    IdSubcategoria = p.IdSubcategoria,
                    RutaImagen = string.IsNullOrEmpty(p.RutaImagen) ? ImagenDefaultRelative : p.RutaImagen,
                    NombreSubcategoria = p.IdSubcategoriaNavigation != null ? p.IdSubcategoriaNavigation.Nombre : null,
                    NombreCategoria = p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoriaNavigation != null
                        ? p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                        : null,
                    Imagenes = p.ImagenesProducto.Select(img => new ImagenProductoDTO
                    {
                        IdImagen = img.IdImagen,
                        RutaImagen = img.RutaImagen,
                        NombreArchivo = img.NombreArchivo,
                        ImagenPrincipal = img.ImagenPrincipal,
                        Orden = img.Orden
                    }).ToList()
                })
                .ToListAsync();

            return Ok(productos);
        }

        // =========================================
        // POST: api/productos/{id}/imagenes
        // Subir múltiples imágenes para un producto
        // IMPORTANT: guardamos después de cada Add para generar IdImagen
        // =========================================
        [HttpPost("{id}/imagenes")]
        public async Task<IActionResult> SubirImagenesProducto(int id, List<IFormFile> archivos)
        {
            try
            {
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProducto)
                    .FirstOrDefaultAsync(p => p.IdProducto == id);

                if (producto == null)
                    return NotFound($"No se encontró un producto con ID {id}");

                if (archivos == null || archivos.Count == 0)
                    return BadRequest("No se enviaron archivos");

                var uploadsFolder = Path.Combine(_environment.WebRootPath ?? string.Empty, "images", "productos");

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var imagenesGuardadasDto = new List<ImagenProductoDTO>();

                foreach (var archivo in archivos)
                {
                    if (archivo == null || archivo.Length == 0) continue;

                    // Sanitizar nombre de archivo y crear nombre único
                    var originalFileName = Path.GetFileName(archivo.FileName);
                    var nombreUnico = $"{Guid.NewGuid()}_{originalFileName}";
                    var rutaCompleta = Path.Combine(uploadsFolder, nombreUnico);

                    // Guardar archivo físicamente
                    using (var stream = new FileStream(rutaCompleta, FileMode.Create))
                    {
                        await archivo.CopyToAsync(stream);
                    }

                    // Calcular si será la principal (si no hay imágenes o si no hay principal marcada)
                    var tienePrincipal = producto.ImagenesProducto.Any(ip => ip.ImagenPrincipal);
                    bool esPrincipal = !tienePrincipal && producto.ImagenesProducto.Count == 0;

                    var nuevaImagen = new ImagenProducto
                    {
                        IdProducto = id,
                        RutaImagen = $"/images/productos/{nombreUnico}",
                        NombreArchivo = originalFileName,
                        ImagenPrincipal = esPrincipal,
                        Orden = producto.ImagenesProducto.Count // si querés otro criterio, ajustar aquí
                    };

                    // Agregar a contexto y guardar PARA OBTENER IdImagen
                    _context.ImagenesProducto.Add(nuevaImagen);
                    await _context.SaveChangesAsync(); // <- guardamos aquí para que IdImagen se genere

                    // Actualizar colecciones en memoria (importante si suben varias imágenes en la misma petición)
                    producto.ImagenesProducto.Add(nuevaImagen);

                    imagenesGuardadasDto.Add(new ImagenProductoDTO
                    {
                        IdImagen = nuevaImagen.IdImagen,
                        RutaImagen = nuevaImagen.RutaImagen,
                        NombreArchivo = nuevaImagen.NombreArchivo,
                        ImagenPrincipal = nuevaImagen.ImagenPrincipal,
                        Orden = nuevaImagen.Orden
                    });
                }

                // Si producto no tenía RutaImagen definida, setear la primera imagen principal o la primera imagen subida
                if (string.IsNullOrEmpty(producto.RutaImagen) || producto.RutaImagen == ImagenDefaultRelative)
                {
                    var principal = producto.ImagenesProducto.FirstOrDefault(i => i.ImagenPrincipal)
                                  ?? producto.ImagenesProducto.FirstOrDefault();

                    if (principal != null)
                    {
                        producto.RutaImagen = principal.RutaImagen;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new
                {
                    mensaje = "Imágenes subidas exitosamente",
                    imagenes = imagenesGuardadasDto
                });
            }
            catch (Exception ex)
            {
                // Devolver detalles útiles para debug, pero en prod podés esconder detalles internos
                return StatusCode(500, $"Error al subir imágenes: {ex.Message} {(ex.InnerException != null ? " | " + ex.InnerException.Message : "")}");
            }
        }

        // =========================================
        // PUT: api/productos/{idProducto}/imagenes/{idImagen}/principal
        // Establecer imagen principal
        // =========================================
        [HttpPut("{idProducto}/imagenes/{idImagen}/principal")]
        public async Task<IActionResult> EstablecerImagenPrincipal(int idProducto, int idImagen)
        {
            try
            {
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProducto)
                    .FirstOrDefaultAsync(p => p.IdProducto == idProducto);

                if (producto == null)
                    return NotFound($"No se encontró un producto con ID {idProducto}");

                var imagen = producto.ImagenesProducto.FirstOrDefault(img => img.IdImagen == idImagen);
                if (imagen == null)
                    return NotFound($"No se encontró una imagen con ID {idImagen} para este producto");

                // Quitar principal de todas las imágenes
                foreach (var img in producto.ImagenesProducto)
                {
                    img.ImagenPrincipal = false;
                }

                // Establecer nueva principal
                imagen.ImagenPrincipal = true;

                // Actualizar ruta principal del producto
                producto.RutaImagen = imagen.RutaImagen;

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Imagen principal establecida correctamente", ruta = producto.RutaImagen });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al establecer imagen principal: {ex.Message}");
            }
        }

        // =========================================
        // DELETE: api/productos/imagenes/{idImagen}
        // Eliminar imagen (registro y archivo físico)
        // =========================================
        [HttpDelete("imagenes/{idImagen}")]
        public async Task<IActionResult> EliminarImagenProducto(int idImagen)
        {
            try
            {
                var imagen = await _context.ImagenesProducto
                    .Include(img => img.Producto)
                    .ThenInclude(p => p.ImagenesProducto)
                    .FirstOrDefaultAsync(img => img.IdImagen == idImagen);

                if (imagen == null)
                    return NotFound($"No se encontró una imagen con ID {idImagen}");

                var producto = imagen.Producto;

                bool eraPrincipal = imagen.ImagenPrincipal;

                // Eliminar archivo físico (si existe)
                if (!string.IsNullOrEmpty(imagen.RutaImagen))
                {
                    var rutaFisica = Path.Combine(_environment.WebRootPath ?? string.Empty, imagen.RutaImagen.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (System.IO.File.Exists(rutaFisica))
                    {
                        try
                        {
                            System.IO.File.Delete(rutaFisica);
                        }
                        catch
                        {
                            // si no se puede borrar el archivo, no rompemos la API. Loggear si corresponde.
                        }
                    }
                }

                // Eliminar registro en DB
                _context.ImagenesProducto.Remove(imagen);
                await _context.SaveChangesAsync();

                // Si era la principal -> asignar otra principal si hay
                if (eraPrincipal && producto != null)
                {
                    // recargar imágenes del producto
                    var imgs = await _context.ImagenesProducto.Where(i => i.IdProducto == producto.IdProducto).OrderBy(i => i.Orden).ToListAsync();
                    if (imgs.Any())
                    {
                        var nueva = imgs.First();
                        nueva.ImagenPrincipal = true;
                        producto.RutaImagen = nueva.RutaImagen;
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        // no quedan imágenes, usar default
                        producto.RutaImagen = ImagenDefaultRelative;
                        await _context.SaveChangesAsync();
                    }
                }

                return Ok(new { mensaje = "Imagen eliminada correctamente", idImagenEliminada = idImagen });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al eliminar la imagen: {ex.Message}");
            }
        }

        // =========================================
        // POST: api/productos
        // Crear producto (si no trae RutaImagen, le ponemos la default)
        // =========================================
        [HttpPost]
        public async Task<IActionResult> CrearProducto([FromBody] ProductoDTO productoDto)
        {
            try
            {
                // Validaciones básicas
                if (string.IsNullOrEmpty(productoDto.Nombre))
                    return BadRequest("El nombre del producto es requerido");

                if (productoDto.Precio <= 0)
                    return BadRequest("El precio debe ser mayor a 0");

                if (productoDto.IdSubcategoria <= 0)
                    return BadRequest("La subcategoría es requerida");

                // Verificar subcategoría
                var subcategoria = await _context.Subcategorias
                    .FirstOrDefaultAsync(s => s.IdSubcategoria == productoDto.IdSubcategoria);

                if (subcategoria == null)
                    return BadRequest($"No existe la subcategoría con ID {productoDto.IdSubcategoria}");

                var nuevoProducto = new Producto
                {
                    Nombre = productoDto.Nombre,
                    Descripcion = productoDto.Descripcion ?? "Sin descripción",
                    Precio = productoDto.Precio,
                    Stock = productoDto.Stock >= 0 ? productoDto.Stock : 0,
                    IdSubcategoria = productoDto.IdSubcategoria,
                    RutaImagen = string.IsNullOrEmpty(productoDto.RutaImagen) ? ImagenDefaultRelative : productoDto.RutaImagen
                };

                _context.Productos.Add(nuevoProducto);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Producto creado exitosamente",
                    id = nuevoProducto.IdProducto,
                    nombre = nuevoProducto.Nombre
                });
            }
            catch (DbUpdateException dbEx)
            {
                var errorMessage = $"Error de base de datos: {dbEx.Message}";
                if (dbEx.InnerException != null) errorMessage += $" | Detalles: {dbEx.InnerException.Message}";
                return StatusCode(500, errorMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al crear el producto: {ex.Message}");
            }
        }

        // =========================================
        // PUT: api/productos/{id}
        // Actualizar producto (solo campos enviados)
        // =========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(int id, [FromBody] ProductoDTO productoDto)
        {
            try
            {
                var productoExistente = await _context.Productos.FirstOrDefaultAsync(p => p.IdProducto == id);

                if (productoExistente == null)
                    return NotFound($"No se encontró un producto con ID {id}");

                // Validar subcategoría si viene
                if (productoDto.IdSubcategoria > 0)
                {
                    var subcategoriaExiste = await _context.Subcategorias.AnyAsync(s => s.IdSubcategoria == productoDto.IdSubcategoria);
                    if (!subcategoriaExiste) return BadRequest("La subcategoría especificada no existe");
                }

                // Actualizar solo campos proporcionados
                if (!string.IsNullOrEmpty(productoDto.Nombre)) productoExistente.Nombre = productoDto.Nombre;
                if (productoDto.Precio > 0) productoExistente.Precio = productoDto.Precio;
                if (productoDto.IdSubcategoria > 0) productoExistente.IdSubcategoria = productoDto.IdSubcategoria;
                if (!string.IsNullOrEmpty(productoDto.Descripcion)) productoExistente.Descripcion = productoDto.Descripcion;
                if (productoDto.Stock >= 0) productoExistente.Stock = productoDto.Stock;

                // Si viene RutaImagen vacía, no la sobreescribimos a vacío; si viene no vacía la usamos
                if (!string.IsNullOrEmpty(productoDto.RutaImagen))
                    productoExistente.RutaImagen = productoDto.RutaImagen;

                await _context.SaveChangesAsync();

                return Ok(new { mensaje = $"Producto con ID {id} actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar el producto: {ex.Message}");
            }
        }

        // =========================================
        // DELETE: api/productos/{id}
        // Eliminar producto + imágenes físicas
        // =========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarProducto(int id)
        {
            try
            {
                var producto = await _context.Productos
                    .Include(p => p.ImagenesProducto)
                    .FirstOrDefaultAsync(p => p.IdProducto == id);

                if (producto == null) return NotFound($"No se encontró un producto con ID {id}");

                // Verificar si está en carritos o ventas
                var enCarrito = await _context.CarritoCompras.AnyAsync(c => c.IdProducto == id);
                var enVentas = await _context.DetalleVentas.AnyAsync(d => d.IdProducto == id);
                if (enCarrito || enVentas) return BadRequest("No se puede eliminar el producto porque está asociado a carritos o ventas existentes");

                // Eliminar archivos físicos
                foreach (var imagen in producto.ImagenesProducto)
                {
                    if (!string.IsNullOrEmpty(imagen.RutaImagen))
                    {
                        var rutaFisica = Path.Combine(_environment.WebRootPath ?? string.Empty, imagen.RutaImagen.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                        if (System.IO.File.Exists(rutaFisica))
                        {
                            try { System.IO.File.Delete(rutaFisica); }
                            catch { /* log si querés */ }
                        }
                    }
                }

                // Eliminar registros
                _context.Productos.Remove(producto);
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = $"Producto '{producto.Nombre}' eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al eliminar el producto: {ex.Message}");
            }
        }
    }
}
