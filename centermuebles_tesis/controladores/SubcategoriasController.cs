using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using centermuebles_tesis.modelos;
using centermuebles_tesis.DTOs;
using System.Collections.Generic;
using System.Linq;

namespace centermuebles_tesis.controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubcategoriasController : ControllerBase
    {
        private readonly CentermueblesContext _context;

        public SubcategoriasController(CentermueblesContext context)
        {
            _context = context;
        }

        // GET: api/subcategorias → Obtiene TODAS las subcategorías con info de su categoría padre
        [HttpGet]
        public IActionResult ObtenerSubcategorias()
        {
            try
            {
                var subcategorias = _context.Subcategorias
                    .Include(s => s.IdCategoriaNavigation)
                    .Select(s => new SubcategoriaDTO
                    {
                        IdSubcategoria = s.IdSubcategoria,
                        Nombre = s.Nombre,
                        IdCategoria = s.IdCategoria,
                        NombreCategoria = s.IdCategoriaNavigation != null ? s.IdCategoriaNavigation.Nombre : "Categoría no disponible"
                    })
                    .ToList();

                return Ok(subcategorias);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", detalles = ex.Message });
            }
        }

        // GET: api/subcategorias/5 → Obtiene UNA subcategoría específica por ID
        [HttpGet("{id}")]
        public IActionResult ObtenerSubcategoriaPorId(int id)
        {
            try
            {
                var subcategoria = _context.Subcategorias
                    .Include(s => s.IdCategoriaNavigation)
                    .Where(s => s.IdSubcategoria == id)
                    .Select(s => new SubcategoriaDTO
                    {
                        IdSubcategoria = s.IdSubcategoria,
                        Nombre = s.Nombre,
                        IdCategoria = s.IdCategoria,
                        NombreCategoria = s.IdCategoriaNavigation != null ? s.IdCategoriaNavigation.Nombre : "Categoría no disponible"
                    })
                    .FirstOrDefault();

                if (subcategoria == null)
                {
                    return NotFound($"No se encontró una subcategoría con ID {id}");
                }

                return Ok(subcategoria);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", detalles = ex.Message });
            }
        }

        // GET: api/subcategorias/5/productos → Obtiene TODOS los productos de una subcategoría
        [HttpGet("{id}/productos")]
        public IActionResult ObtenerProductosPorSubcategoria(int id)
        {
            try
            {
                var productos = _context.Productos
                    .Include(p => p.IdSubcategoriaNavigation)
                        .ThenInclude(s => s.IdCategoriaNavigation)
                    .Where(p => p.IdSubcategoria == id)
                    .Select(p => new ProductoDTO
                    {
                        IdProducto = p.IdProducto,
                        Nombre = p.Nombre,
                        Descripcion = p.Descripcion,
                        Precio = p.Precio,
                        Stock = p.Stock,
                        IdSubcategoria = p.IdSubcategoria,
                        RutaImagen = p.RutaImagen,
                        NombreSubcategoria = p.IdSubcategoriaNavigation != null ? p.IdSubcategoriaNavigation.Nombre : "Subcategoría no disponible",
                        NombreCategoria = p.IdSubcategoriaNavigation != null && p.IdSubcategoriaNavigation.IdCategoriaNavigation != null
                                            ? p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                                            : "Categoría no disponible"
                    })
                    .ToList();

                if (!productos.Any())
                {
                    return NotFound($"No se encontraron productos para la subcategoría con ID {id}");
                }

                return Ok(productos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", detalles = ex.Message });
            }
        }

        // POST: api/subcategorias → CREA una nueva subcategoría
        [HttpPost]
        public IActionResult CrearSubcategoria([FromBody] SubcategoriaDTO subcategoriaDto)
        {
            try
            {
                if (string.IsNullOrEmpty(subcategoriaDto.Nombre))
                    return BadRequest("El nombre de la subcategoría es requerido");

                if (subcategoriaDto.IdCategoria <= 0)
                    return BadRequest("La categoría es requerida");

                // Verificar si la categoría existe
                var categoriaExistente = _context.Categorias
                    .FirstOrDefault(c => c.IdCategoria == subcategoriaDto.IdCategoria);

                if (categoriaExistente == null)
                    return BadRequest($"No existe la categoría con ID {subcategoriaDto.IdCategoria}");

                // Verificar duplicados (mismo nombre en misma categoría)
                var subcategoriaExistente = _context.Subcategorias
                    .FirstOrDefault(s => s.Nombre.ToLower() == subcategoriaDto.Nombre.ToLower() && s.IdCategoria == subcategoriaDto.IdCategoria);

                if (subcategoriaExistente != null)
                    return BadRequest("Ya existe una subcategoría con ese nombre en esta categoría");

                var nuevaSubcategoria = new Subcategorias
                {
                    Nombre = subcategoriaDto.Nombre,
                    IdCategoria = subcategoriaDto.IdCategoria
                };

                _context.Subcategorias.Add(nuevaSubcategoria);
                _context.SaveChanges();

                return Ok(new
                {
                    mensaje = "Subcategoría creada exitosamente",
                    id = nuevaSubcategoria.IdSubcategoria,
                    nombre = nuevaSubcategoria.Nombre,
                    categoria = categoriaExistente.Nombre
                });
            }
            catch (DbUpdateException dbEx)
            {
                var errorMessage = $"Error de base de datos: {dbEx.Message}";
                if (dbEx.InnerException != null)
                {
                    errorMessage += $" | Detalles: {dbEx.InnerException.Message}";
                }
                return StatusCode(500, errorMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al crear la subcategoría: {ex.Message}");
            }
        }

        // PUT: api/subcategorias/5 → ACTUALIZA una subcategoría existente
        [HttpPut("{id}")]
        public IActionResult ActualizarSubcategoria(int id, [FromBody] SubcategoriaDTO subcategoriaDto)
        {
            try
            {
                var subcategoriaExistente = _context.Subcategorias
                    .FirstOrDefault(s => s.IdSubcategoria == id);

                if (subcategoriaExistente == null)
                {
                    return NotFound($"No se encontró una subcategoría con ID {id}");
                }

                if (string.IsNullOrEmpty(subcategoriaDto.Nombre))
                    return BadRequest("El nombre de la subcategoría es requerido");

                // Verificar si la categoría existe (si se está actualizando)
                if (subcategoriaDto.IdCategoria > 0)
                {
                    var categoriaExistente = _context.Categorias
                        .FirstOrDefault(c => c.IdCategoria == subcategoriaDto.IdCategoria);

                    if (categoriaExistente == null)
                        return BadRequest($"No existe la categoría con ID {subcategoriaDto.IdCategoria}");
                }

                // Verificar duplicados (excluyendo la actual)
                var subcategoriaDuplicada = _context.Subcategorias
                    .FirstOrDefault(s => s.Nombre.ToLower() == subcategoriaDto.Nombre.ToLower() &&
                                       s.IdCategoria == (subcategoriaDto.IdCategoria > 0 ? subcategoriaDto.IdCategoria : subcategoriaExistente.IdCategoria) &&
                                       s.IdSubcategoria != id);

                if (subcategoriaDuplicada != null)
                    return BadRequest("Ya existe otra subcategoría con ese nombre en esta categoría");

                // Actualizar campos
                subcategoriaExistente.Nombre = subcategoriaDto.Nombre;

                if (subcategoriaDto.IdCategoria > 0)
                    subcategoriaExistente.IdCategoria = subcategoriaDto.IdCategoria;

                _context.SaveChanges();

                return Ok(new { mensaje = $"Subcategoría con ID {id} actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar la subcategoría: {ex.Message}");
            }
        }

        // DELETE: api/subcategorias/5 → ELIMINA una subcategoría
        [HttpDelete("{id}")]
        public IActionResult EliminarSubcategoria(int id)
        {
            try
            {
                var subcategoria = _context.Subcategorias
                    .Include(s => s.Productos)
                    .FirstOrDefault(s => s.IdSubcategoria == id);

                if (subcategoria == null)
                {
                    return NotFound($"No se encontró una subcategoría con ID {id}");
                }

                if (subcategoria.Productos.Any())
                {
                    return BadRequest("No se puede eliminar la subcategoría porque tiene productos asociados");
                }

                _context.Subcategorias.Remove(subcategoria);
                _context.SaveChanges();

                return Ok(new { mensaje = $"Subcategoría '{subcategoria.Nombre}' eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al eliminar la subcategoría: {ex.Message}");
            }
        }
    }
}