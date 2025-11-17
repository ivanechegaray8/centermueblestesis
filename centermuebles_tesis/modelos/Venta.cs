using System;
using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Venta
    {
        public int IdVenta { get; set; }
        public int IdUsuario { get; set; }
        public DateTime? FechaVenta { get; set; }
        public decimal TotalVenta { get; set; }
        public string? EstadoVenta { get; set; } = "Pendiente"; // ← Valor por defecto aquí
        public string MetodoPago { get; set; } = null!;

        public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
        public virtual ICollection<DetalleVentas> DetalleVentas { get; set; } = new List<DetalleVentas>();
    }
}