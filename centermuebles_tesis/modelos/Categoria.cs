using System.Text.Json.Serialization;
using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Categorias
    {
        public Categorias()
        {
            Subcategorias = new HashSet<Subcategorias>();
        }

        public int IdCategoria { get; set; }
        public string Nombre { get; set; } = null!;
        public string? Descripcion { get; set; }

        //JsonIgnore para evitar bucle
        [JsonIgnore]
        public virtual ICollection<Subcategorias> Subcategorias { get; set; }
    }
}