using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace centermuebles_tesis.modelos
{
    public partial class Producto
    {
        public Producto()
        {
            DetalleVentas = new HashSet<DetalleVentas>();
            Ventas = new HashSet<Venta>();
            CarritoCompras = new HashSet<CarritoCompras>();
            ImagenesProducto = new HashSet<ImagenProducto>();
        }

        public int IdProducto { get; set; }

        [Required(ErrorMessage = "El nombre es requerido")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres")]
        public string Nombre { get; set; } = null!;

        [StringLength(500, ErrorMessage = "La descripción no puede exceder 500 caracteres")]
        public string? Descripcion { get; set; }

        [Required(ErrorMessage = "El precio es requerido")]
        [Range(0.01, 100000, ErrorMessage = "El precio debe ser mayor a 0")]
        public decimal Precio { get; set; }

        [Required(ErrorMessage = "El stock es requerido")]
        [Range(0, 10000, ErrorMessage = "El stock debe ser entre 0 y 10000")]
        public int Stock { get; set; }

        [Required(ErrorMessage = "La subcategoría es requerida")]
        public int IdSubcategoria { get; set; }

        // Mantener por compatibilidad (si tu base aún lo usa)
        public string? RutaImagen { get; set; }

        // Relación multiple imágenes
        public virtual ICollection<ImagenProducto> ImagenesProducto { get; set; }

        // Evitar ciclos
        [JsonIgnore]
        public virtual Subcategorias? IdSubcategoriaNavigation { get; set; }

        [JsonIgnore]
        public virtual ICollection<DetalleVentas> DetalleVentas { get; set; }

        [JsonIgnore]
        public virtual ICollection<Venta> Ventas { get; set; }

        [JsonIgnore]
        public virtual ICollection<CarritoCompras> CarritoCompras { get; set; }
    }
}
