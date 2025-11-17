using centermuebles_tesis.DTOs;
using centermuebles_tesis.modelos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace centermuebles_tesis.controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class VentasController : ControllerBase
    {
        private readonly CentermueblesContext _context;

        public VentasController(CentermueblesContext context)
        {
            _context = context;
        }

        // ✅ ORDEN CORREGIDO: Rutas específicas PRIMERO

        // GET: api/ventas/miscompras
        [HttpGet("miscompras")]
        [Authorize]
        public async Task<IActionResult> ObtenerMisCompras()
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized(new { mensaje = "Usuario no autenticado" });

                var compras = await _context.Ventas
                    .Where(v => v.IdUsuario == userId)
                    .Include(v => v.DetalleVentas)
                        .ThenInclude(d => d.IdProductoNavigation)
                    .OrderByDescending(v => v.FechaVenta)
                    .Select(v => new
                    {
                        v.IdVenta,
                        Usuario = new
                        {
                            v.IdUsuarioNavigation.IdUsuario,
                            v.IdUsuarioNavigation.NombreCompleto,
                            v.IdUsuarioNavigation.Email,
                            v.IdUsuarioNavigation.Telefono,
                            v.IdUsuarioNavigation.Direccion,
                            v.IdUsuarioNavigation.CodigoPostal,
                            v.IdUsuarioNavigation.Rol
                        },
                        v.FechaVenta,
                        Total = v.TotalVenta,
                        Estado = v.EstadoVenta,
                        v.MetodoPago,
                        Productos = v.DetalleVentas.Select(d => new
                        {
                            d.IdProducto,
                            Nombre = d.IdProductoNavigation.Nombre,
                            d.Cantidad,
                            d.PrecioUnitario,
                            d.SubTotal,
                            Stock = d.IdProductoNavigation.Stock // ← AGREGADO STOCK
                        })
                    }).ToListAsync();

                return Ok(compras);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", detalle = ex.Message });
            }
        }

        // GET: api/ventas/estadisticas
        [HttpGet("estadisticas")]
        [Authorize]
        public async Task<IActionResult> ObtenerEstadisticas()
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized(new { mensaje = "Usuario no autenticado" });

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario?.Rol != "administrador")
                    return Forbid("No tienes permisos para ver estadísticas");

                var hoy = DateTime.Today;
                var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

                var totalVentas = await _context.Ventas
                    .Where(v => v.EstadoVenta == "Pendiente" || v.EstadoVenta == "Completada")
                    .SumAsync(v => v.TotalVenta);

                var ventasHoy = await _context.Ventas
                    .Where(v => v.FechaVenta.HasValue &&
                               v.FechaVenta.Value.Date == hoy &&
                               (v.EstadoVenta == "Pendiente" || v.EstadoVenta == "Completada"))
                    .ToListAsync();

                var productosVendidosMes = await _context.DetalleVentas
                    .Include(d => d.IdVentaNavigation)
                    .Where(d => d.IdVentaNavigation.FechaVenta.HasValue &&
                                d.IdVentaNavigation.FechaVenta.Value >= inicioMes &&
                                (d.IdVentaNavigation.EstadoVenta == "Pendiente" || d.IdVentaNavigation.EstadoVenta == "Completada"))
                    .SumAsync(d => d.Cantidad);

                var ventasPendientes = await _context.Ventas.CountAsync(v => v.EstadoVenta == "Pendiente");

                return Ok(new
                {
                    TotalVentas = totalVentas,
                    VentasHoy = new
                    {
                        Total = ventasHoy.Sum(v => v.TotalVenta),
                        Transacciones = ventasHoy.Count
                    },
                    VentasPendientes = ventasPendientes,
                    ProductosVendidos = productosVendidosMes
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al obtener estadísticas", detalle = ex.Message });
            }
        }

        // GET: api/ventas/debug/{id}
        [HttpGet("debug/{id}")]
        [Authorize]
        public async Task<IActionResult> DebugVenta(int id)
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null)
                    return Unauthorized(new { mensaje = "Usuario no autenticado", error = "UserId es null" });

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario?.Rol != "administrador")
                    return Forbid("No tienes permisos para ver esta información");

                var venta = await _context.Ventas
                    .Include(v => v.IdUsuarioNavigation)
                    .Include(v => v.DetalleVentas)
                        .ThenInclude(d => d.IdProductoNavigation)
                    .Where(v => v.IdVenta == id)
                    .Select(v => new
                    {
                        IdVenta = v.IdVenta,
                        Usuario = new
                        {
                            IdUsuario = v.IdUsuarioNavigation.IdUsuario,
                            NombreCompleto = v.IdUsuarioNavigation.NombreCompleto,
                            Email = v.IdUsuarioNavigation.Email,
                            Telefono = v.IdUsuarioNavigation.Telefono,
                            Direccion = v.IdUsuarioNavigation.Direccion,
                            CodigoPostal = v.IdUsuarioNavigation.CodigoPostal,
                            Rol = v.IdUsuarioNavigation.Rol
                        },
                        FechaVenta = v.FechaVenta,
                        Total = v.TotalVenta,
                        Estado = v.EstadoVenta,
                        MetodoPago = v.MetodoPago,
                        Productos = v.DetalleVentas.Select(d => new
                        {
                            d.IdProducto,
                            Nombre = d.IdProductoNavigation.Nombre,
                            d.Cantidad,
                            d.PrecioUnitario,
                            d.SubTotal,
                            Stock = d.IdProductoNavigation.Stock // ← AGREGADO STOCK
                        })
                    })
                    .FirstOrDefaultAsync();

                if (venta == null)
                    return NotFound(new { mensaje = $"Venta con ID {id} no encontrada" });

                return Ok(venta);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error interno al obtener venta",
                    error = ex.Message,
                    detalle = ex.InnerException?.Message
                });
            }
        }

        // GET: api/ventas - Todas las ventas
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> ObtenerVentas()
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized(new { mensaje = "Usuario no autenticado" });

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario?.Rol != "administrador")
                    return Forbid("No tienes permisos para ver todas las ventas");

                var ventas = await _context.Ventas
                    .Include(v => v.IdUsuarioNavigation)
                    .Include(v => v.DetalleVentas)
                        .ThenInclude(d => d.IdProductoNavigation)
                    .OrderByDescending(v => v.FechaVenta)
                    .Select(v => new
                    {
                        v.IdVenta,
                        Usuario = new
                        {
                            v.IdUsuarioNavigation.IdUsuario,
                            v.IdUsuarioNavigation.NombreCompleto,
                            v.IdUsuarioNavigation.Email,
                            v.IdUsuarioNavigation.Telefono,
                            v.IdUsuarioNavigation.Direccion,
                            v.IdUsuarioNavigation.CodigoPostal,
                            v.IdUsuarioNavigation.Rol
                        },
                        v.FechaVenta,
                        Total = v.TotalVenta,
                        Estado = v.EstadoVenta,
                        v.MetodoPago,
                        Productos = v.DetalleVentas.Select(d => new
                        {
                            d.IdProducto,
                            Nombre = d.IdProductoNavigation.Nombre,
                            d.Cantidad,
                            d.PrecioUnitario,
                            d.SubTotal,
                            Stock = d.IdProductoNavigation.Stock // ← AGREGADO STOCK
                        })
                    }).ToListAsync();

                return Ok(ventas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", detalle = ex.Message });
            }
        }

        // ✅ ENDPOINT CLAVE: GET: api/ventas/{id} - Obtener venta específica
        [HttpGet("{id:int}")]
        [Authorize]
        public async Task<IActionResult> ObtenerVenta(int id)
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized(new { mensaje = "Usuario no autenticado" });

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario?.Rol != "administrador")
                    return Forbid("No tienes permisos para ver esta venta");

                var venta = await _context.Ventas
                    .Include(v => v.IdUsuarioNavigation)
                    .Include(v => v.DetalleVentas)
                        .ThenInclude(d => d.IdProductoNavigation)
                    .Where(v => v.IdVenta == id)
                    .Select(v => new
                    {
                        IdVenta = v.IdVenta,
                        Usuario = new
                        {
                            IdUsuario = v.IdUsuarioNavigation.IdUsuario,
                            NombreCompleto = v.IdUsuarioNavigation.NombreCompleto,
                            Email = v.IdUsuarioNavigation.Email,
                            Telefono = v.IdUsuarioNavigation.Telefono,
                            Direccion = v.IdUsuarioNavigation.Direccion,
                            CodigoPostal = v.IdUsuarioNavigation.CodigoPostal,
                            Rol = v.IdUsuarioNavigation.Rol
                        },
                        FechaVenta = v.FechaVenta,
                        Total = v.TotalVenta,
                        Estado = v.EstadoVenta,
                        MetodoPago = v.MetodoPago,
                        Productos = v.DetalleVentas.Select(d => new
                        {
                            d.IdProducto,
                            Nombre = d.IdProductoNavigation.Nombre,
                            d.Cantidad,
                            d.PrecioUnitario,
                            d.SubTotal,
                            Stock = d.IdProductoNavigation.Stock // ← AGREGADO STOCK
                        })
                    })
                    .FirstOrDefaultAsync();

                if (venta == null)
                    return NotFound(new { mensaje = $"Venta con ID {id} no encontrada" });

                return Ok(venta);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    mensaje = "Error interno al obtener venta",
                    error = ex.Message,
                    detalle = ex.InnerException?.Message
                });
            }
        }

        // PUT: api/ventas/{id}/estado
        [HttpPut("{id}/estado")]
        [Authorize]
        public async Task<IActionResult> ActualizarEstado(int id, [FromBody] ActualizarEstadoDTO estadoDTO)
        {
            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized();

                var usuario = await _context.Usuarios.FindAsync(userId);
                if (usuario?.Rol != "administrador")
                    return Forbid("No tienes permisos");

                var venta = await _context.Ventas.FindAsync(id);
                if (venta == null)
                    return NotFound(new { mensaje = "Venta no encontrada" });

                venta.EstadoVenta = estadoDTO.Estado;
                await _context.SaveChangesAsync();

                return Ok(new { mensaje = "Estado actualizado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno", detalle = ex.Message });
            }
        }

        // POST: api/ventas/procesarcompra
        [HttpPost("procesarcompra")]
        [Authorize]
        public async Task<IActionResult> ProcesarCompra([FromBody] CompraRequestDTO compraRequest)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var userId = ObtenerUsuarioId();
                if (userId == null) return Unauthorized();

                if (compraRequest.Items == null || !compraRequest.Items.Any())
                    return BadRequest(new { mensaje = "No hay productos" });

                decimal totalVenta = 0;
                var errores = new List<string>();

                foreach (var item in compraRequest.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    if (producto == null)
                    {
                        errores.Add($"Producto ID {item.IdProducto} no existe");
                        continue;
                    }

                    if (producto.Stock < item.Cantidad)
                        errores.Add($"{producto.Nombre}: stock {producto.Stock}, solicitado {item.Cantidad}");
                    else
                        totalVenta += producto.Precio * item.Cantidad;
                }

                if (errores.Any())
                    return BadRequest(new { mensaje = "Stock insuficiente", errores });

                var venta = new Venta
                {
                    IdUsuario = userId.Value,
                    FechaVenta = DateTime.Now,
                    TotalVenta = totalVenta,
                    EstadoVenta = "Pendiente",
                    MetodoPago = compraRequest.MetodoPago ?? "Efectivo"
                };

                _context.Ventas.Add(venta);
                await _context.SaveChangesAsync();

                foreach (var item in compraRequest.Items)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    producto.Stock -= item.Cantidad;

                    _context.DetalleVentas.Add(new DetalleVentas
                    {
                        IdVenta = venta.IdVenta,
                        IdProducto = item.IdProducto,
                        Cantidad = item.Cantidad,
                        PrecioUnitario = producto.Precio,
                        SubTotal = producto.Precio * item.Cantidad
                    });
                }

                await _context.SaveChangesAsync();

                var carrito = _context.CarritoCompras.Where(c => c.IdUsuario == userId);
                _context.CarritoCompras.RemoveRange(carrito);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return Ok(new
                {
                    Success = true,
                    Message = "Compra realizada exitosamente",
                    IdVenta = venta.IdVenta,
                    Total = totalVenta
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Success = false, Message = ex.Message });
            }
        }

        // POST: api/ventas/validarstock
        [HttpPost("validarstock")]
        public async Task<IActionResult> ValidarStock([FromBody] List<ItemCompraDTO> items)
        {
            try
            {
                var respuesta = new List<StockValidationDTO>();

                foreach (var item in items)
                {
                    var producto = await _context.Productos.FindAsync(item.IdProducto);
                    respuesta.Add(new StockValidationDTO
                    {
                        IdProducto = item.IdProducto,
                        NombreProducto = producto?.Nombre ?? "No encontrado",
                        StockDisponible = producto?.Stock ?? 0,
                        CantidadSolicitada = item.Cantidad
                    });
                }

                return Ok(new
                {
                    stockSuficiente = respuesta.All(x => x.StockSuficiente),
                    validaciones = respuesta
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error al validar stock", detalle = ex.Message });
            }
        }

        // FUNCIONES AUXILIARES
        private int? ObtenerUsuarioId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out int id) ? id : (int?)null;
        }
    }

    public class ActualizarEstadoDTO
    {
        public string Estado { get; set; } = string.Empty;
    }

    public class CompraRequestDTO
    {
        public List<ItemCompraDTO> Items { get; set; } = new List<ItemCompraDTO>();
        public string? MetodoPago { get; set; }
    }

    public class ItemCompraDTO
    {
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
    }

    public class StockValidationDTO
    {
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int StockDisponible { get; set; }
        public int CantidadSolicitada { get; set; }
        public bool StockSuficiente => StockDisponible >= CantidadSolicitada;
    }
}