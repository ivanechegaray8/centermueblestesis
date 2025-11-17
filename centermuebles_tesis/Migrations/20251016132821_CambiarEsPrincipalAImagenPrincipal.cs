using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace centermuebles_tesis.Migrations
{
    /// <inheritdoc />
    public partial class CambiarEsPrincipalAImagenPrincipal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EsPrincipal",
                table: "ImagenesProducto",
                newName: "ImagenPrincipal");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImagenPrincipal",
                table: "ImagenesProducto",
                newName: "EsPrincipal");
        }
    }
}
