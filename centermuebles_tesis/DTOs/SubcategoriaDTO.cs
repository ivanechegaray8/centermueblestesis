namespace centermuebles_tesis.DTOs
{
    // DTO completo para subcategoría - incluye información de la categoría padre
    // Útil cuando necesitas mostrar datos de subcategoría junto con su categoría
    public class SubcategoriaDTO
    {
        public int IdSubcategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public int IdCategoria { get; set; }          // ID para relaciones
        public string? NombreCategoria { get; set; }  // Nombre para mostrar sin hacer JOINs
    }

    // DTO simple para subcategoría - solo datos básicos
    // Útil para listados simples, dropdowns, o cuando se usa dentro de otros DTOs
    public class SubcategoriaSimpleDTO
    {
        public int IdSubcategoria { get; set; }
        public string Nombre { get; set; } = null!;
    }
}