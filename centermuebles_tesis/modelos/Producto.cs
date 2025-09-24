using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Producto
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int IdSubcategoria { get; set; }
        public string? RutaImagen { get; set; }

        public virtual Subcategorias IdSubcategoriaNavigation { get; set; } = null!;
        public virtual ICollection<DetalleVentas> DetalleVentas { get; set; } = new List<DetalleVentas>();
        public virtual ICollection<Venta> Venta { get; set; } = new List<Venta>();
        public virtual ICollection<CarritoCompras> CarritoCompras { get; set; } = new List<CarritoCompras>();
    }
}