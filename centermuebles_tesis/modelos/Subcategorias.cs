using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Subcategorias
    {
        public Subcategorias()
        {
            Productos = new HashSet<Producto>();
        }

        public int IdSubcategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public int IdCategoria { get; set; }

        // JsonIgnore para evitar bucle
        [JsonIgnore]
        public virtual Categorias IdCategoriaNavigation { get; set; } = null!;

        [JsonIgnore]
        public virtual ICollection<Producto> Productos { get; set; }
    }
}