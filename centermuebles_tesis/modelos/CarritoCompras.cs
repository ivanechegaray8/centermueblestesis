using System;

namespace centermuebles_tesis.modelos
{
    public partial class CarritoCompras
    {
        public int IdCarrito { get; set; }
        public int? IdUsuario { get; set; }
        public int IdProducto { get; set; }
        public int Cantidad { get; set; }
        public string? IdSesion { get; set; }
        public DateTime? FechaAgregado { get; set; }

        public virtual Producto IdProductoNavigation { get; set; } = null!;
        public virtual Usuario? IdUsuarioNavigation { get; set; }
    }
}