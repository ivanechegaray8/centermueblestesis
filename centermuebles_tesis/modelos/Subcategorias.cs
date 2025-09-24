using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Subcategorias
    {
        public int IdSubcategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public int IdCategoria { get; set; }

        public virtual Categorias IdCategoriaNavigation { get; set; } = null!;
        public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();
    }
}