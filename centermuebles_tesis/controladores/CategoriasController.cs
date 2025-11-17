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
    public class CategoriasController : ControllerBase
    {
        private readonly CentermueblesContext _context;

        public CategoriasController(CentermueblesContext context)
        {
            _context = context;
        }

        // GET: api/categorias → devuelve todas las categorías CON DTOs
        [HttpGet]
        public IActionResult ObtenerCategorias()
        {
            var categorias = _context.Categorias
                .Include(c => c.Subcategorias)
                .Select(c => new CategoriaDTO
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.Nombre,
                    TotalSubcategorias = c.Subcategorias.Count
                })
                .ToList();

            return Ok(categorias);
        }

        // GET: api/categorias/5 → devuelve la categoría con ID 5
        [HttpGet("{id}")]
        public IActionResult ObtenerCategoriaPorId(int id)
        {
            var categoria = _context.Categorias
                .Include(c => c.Subcategorias)
                .Where(c => c.IdCategoria == id)
                .Select(c => new CategoriaConSubcategoriasDTO
                {
                    IdCategoria = c.IdCategoria,
                    Nombre = c.Nombre,
                    Subcategorias = c.Subcategorias.Select(s => new SubcategoriaSimpleDTO
                    {
                        IdSubcategoria = s.IdSubcategoria,
                        Nombre = s.Nombre
                    }).ToList()
                })
                .FirstOrDefault();

            if (categoria == null)
            {
                return NotFound($"No se encontró una categoría con ID {id}");
            }

            return Ok(categoria);
        }

        // GET: api/categorias/5/subcategorias → subcategorías de una categoría
        [HttpGet("{id}/subcategorias")]
        public IActionResult ObtenerSubcategoriasPorCategoria(int id)
        {
            var subcategorias = _context.Subcategorias
                .Include(s => s.IdCategoriaNavigation)
                .Where(s => s.IdCategoria == id)
                .Select(s => new SubcategoriaDTO
                {
                    IdSubcategoria = s.IdSubcategoria,
                    Nombre = s.Nombre,
                    IdCategoria = s.IdCategoria,
                    NombreCategoria = s.IdCategoriaNavigation.Nombre
                })
                .ToList();

            if (!subcategorias.Any())
            {
                return NotFound($"No se encontraron subcategorías para la categoría con ID {id}");
            }

            return Ok(subcategorias);
        }

        // GET: api/categorias/5/productos → productos de una categoría
        [HttpGet("{id}/productos")]
        public IActionResult ObtenerProductosPorCategoria(int id)
        {
            var productos = _context.Productos
                .Include(p => p.IdSubcategoriaNavigation)
                    .ThenInclude(s => s.IdCategoriaNavigation)
                .Where(p => p.IdSubcategoriaNavigation.IdCategoria == id)
                .Select(p => new ProductoDTO
                {
                    IdProducto = p.IdProducto,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    IdSubcategoria = p.IdSubcategoria,
                    RutaImagen = p.RutaImagen,
                    NombreSubcategoria = p.IdSubcategoriaNavigation.Nombre,
                    NombreCategoria = p.IdSubcategoriaNavigation.IdCategoriaNavigation.Nombre
                })
                .ToList();

            return Ok(productos);
        }

        // POST: api/categorias → crea una nueva categoría
        [HttpPost]
        public IActionResult CrearCategoria([FromBody] CategoriaDTO categoriaDto)
        {
            try
            {
                if (string.IsNullOrEmpty(categoriaDto.Nombre))
                    return BadRequest("El nombre de la categoría es requerido");

                // Verificar si ya existe una categoría con el mismo nombre
                var categoriaExistente = _context.Categorias
                    .FirstOrDefault(c => c.Nombre.ToLower() == categoriaDto.Nombre.ToLower());

                if (categoriaExistente != null)
                    return BadRequest("Ya existe una categoría con ese nombre");

                var nuevaCategoria = new Categorias
                {
                    Nombre = categoriaDto.Nombre
                };

                _context.Categorias.Add(nuevaCategoria);
                _context.SaveChanges();

                return Ok(new
                {
                    mensaje = "Categoría creada exitosamente",
                    id = nuevaCategoria.IdCategoria,
                    nombre = nuevaCategoria.Nombre
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
                return StatusCode(500, $"Error al crear la categoría: {ex.Message}");
            }
        }

        // PUT: api/categorias/5 → actualiza una categoría
        [HttpPut("{id}")]
        public IActionResult ActualizarCategoria(int id, [FromBody] CategoriaDTO categoriaDto)
        {
            try
            {
                var categoriaExistente = _context.Categorias
                    .FirstOrDefault(c => c.IdCategoria == id);

                if (categoriaExistente == null)
                {
                    return NotFound($"No se encontró una categoría con ID {id}");
                }

                if (string.IsNullOrEmpty(categoriaDto.Nombre))
                    return BadRequest("El nombre de la categoría es requerido");

                // Verificar si ya existe otra categoría con el mismo nombre
                var categoriaDuplicada = _context.Categorias
                    .FirstOrDefault(c => c.Nombre.ToLower() == categoriaDto.Nombre.ToLower() && c.IdCategoria != id);

                if (categoriaDuplicada != null)
                    return BadRequest("Ya existe otra categoría con ese nombre");

                categoriaExistente.Nombre = categoriaDto.Nombre;
                _context.SaveChanges();

                return Ok(new { mensaje = $"Categoría con ID {id} actualizada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar la categoría: {ex.Message}");
            }
        }

        // DELETE: api/categorias/5 → elimina una categoría
        [HttpDelete("{id}")]
        public IActionResult EliminarCategoria(int id)
        {
            try
            {
                var categoria = _context.Categorias
                    .Include(c => c.Subcategorias)
                    .FirstOrDefault(c => c.IdCategoria == id);

                if (categoria == null)
                {
                    return NotFound($"No se encontró una categoría con ID {id}");
                }

                // Verificar si tiene subcategorías asociadas
                if (categoria.Subcategorias.Any())
                {
                    return BadRequest("No se puede eliminar la categoría porque tiene subcategorías asociadas");
                }

                _context.Categorias.Remove(categoria);
                _context.SaveChanges();

                return Ok(new { mensaje = $"Categoría '{categoria.Nombre}' eliminada correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al eliminar la categoría: {ex.Message}");
            }
        }
    }
}