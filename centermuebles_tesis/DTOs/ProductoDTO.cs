using System.Collections.Generic;

namespace centermuebles_tesis.DTOs
{
    // DTO para representar un producto con toda la información necesaria
    // en la mayoría de los casos de uso (listados, catálogos, detalles)
    public class ProductoDTO
    {
        public int IdProducto { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal Precio { get; set; }
        public int Stock { get; set; }
        public int IdSubcategoria { get; set; }          // ID para relaciones/foreign key

        // Mantener para compatibilidad, pero ahora es opcional
        public string? RutaImagen { get; set; }          // Path de la imagen principal (compatibilidad)

        // Lista de múltiples imágenes del producto
        public List<ImagenProductoDTO> Imagenes { get; set; } = new List<ImagenProductoDTO>();

        public string? NombreSubcategoria { get; set; }  // Nombre para mostrar (evita JOIN en frontend)
        public string? NombreCategoria { get; set; }     // Nombre para mostrar (evita JOIN en frontend)

        // Propiedades calculadas para fácil acceso
        public string ImagenPrincipal
        {
            get
            {
                // Primero busca la imagen marcada como principal
                var imagenPrincipal = Imagenes.Find(img => img.ImagenPrincipal);
                if (imagenPrincipal != null)
                    return imagenPrincipal.RutaImagen;

                // Si no hay principal, usa la primera imagen
                if (Imagenes.Count > 0)
                    return Imagenes[0].RutaImagen;

                // Si no hay imágenes, usa la ruta legacy o string vacío
                return RutaImagen ?? string.Empty;
            }
        }

        public bool TieneMultiplesImagenes => Imagenes.Count > 1;
    }

    // DTO: Para manejar las imágenes del producto
    public class ImagenProductoDTO
    {
        public int IdImagen { get; set; }
        public string RutaImagen { get; set; } = null!;
        public string? NombreArchivo { get; set; }
        public bool ImagenPrincipal { get; set; }
        public int Orden { get; set; }
    }
}