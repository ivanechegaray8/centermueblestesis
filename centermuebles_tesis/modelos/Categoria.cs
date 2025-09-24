using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Categorias
    {
        public int IdCategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }

        public virtual ICollection<Subcategorias> Subcategoria { get; set; } = new List<Subcategorias>();
        public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
    }
}