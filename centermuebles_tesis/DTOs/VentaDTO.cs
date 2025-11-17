using System;
using System.Collections.Generic;

namespace centermuebles_tesis.DTOs
{
    public class VentaDTO
    {
        public int IdVenta { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public DateTime FechaVenta { get; set; }
        public decimal TotalVenta { get; set; }
        public string EstadoVenta { get; set; } = string.Empty;
        public string MetodoPago { get; set; } = "Efectivo";
        public List<DetalleVentaDTO> Productos { get; set; } = new List<DetalleVentaDTO>();
    }

    public class DetalleVentaDTO
    {
        public int IdProducto { get; set; }
        public string NombreProducto { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
    }
}