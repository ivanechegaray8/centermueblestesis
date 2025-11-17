using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace centermuebles_tesis.modelos
{
    public class ImagenProducto
    {
        public int IdImagen { get; set; }

        [Required]
        public int IdProducto { get; set; }

        [Required(ErrorMessage = "La ruta de la imagen es requerida")]
        [StringLength(500)]
        public string RutaImagen { get; set; } = null!;

        [StringLength(100)]
        public string? NombreArchivo { get; set; }

        public bool ImagenPrincipal { get; set; } = false;

        public int Orden { get; set; } = 0;

        // ✅ Navegación
        [JsonIgnore]
        public virtual Producto Producto { get; set; } = null!;
    }
}