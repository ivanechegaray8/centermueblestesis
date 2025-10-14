namespace centermuebles_tesis.DTOs
{
    // DTO simple para cuando solo necesitas los datos básicos de una categoría
    // + el total de subcategorías (sin cargar la lista completa)
    // Útil para listados, grids, comboboxes
    public class CategoriaDTO
    {
        public int IdCategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public int TotalSubcategorias { get; set; }
    }

    // DTO completo para cuando necesitas la categoría 
    // + toda la lista de sus subcategorías
    // Útil para páginas de detalle, edición, o donde muestras el árbol completo
    public class CategoriaConSubcategoriasDTO
    {
        public int IdCategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public List<SubcategoriaSimpleDTO>? Subcategorias { get; set; }
    }
}