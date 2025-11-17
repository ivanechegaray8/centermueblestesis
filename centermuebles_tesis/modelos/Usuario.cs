using System.Collections.Generic;

namespace centermuebles_tesis.modelos
{
    public partial class Usuario
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Contraseña { get; set; } = null!;
        public string NombreCompleto { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? CodigoPostal { get; set; }
        public string Rol { get; set; } = null!;


        public virtual ICollection<Venta> Ventas { get; set; } = new List<Venta>();
        public virtual ICollection<CarritoCompras> CarritoCompras { get; set; } = new List<CarritoCompras>();
    }
}