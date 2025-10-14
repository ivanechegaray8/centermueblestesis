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
        public string? RutaImagen { get; set; }          // Path de la imagen del producto
        public string? NombreSubcategoria { get; set; }  // Nombre para mostrar (evita JOIN en frontend)
        public string? NombreCategoria { get; set; }     // Nombre para mostrar (evita JOIN en frontend)
    }
}