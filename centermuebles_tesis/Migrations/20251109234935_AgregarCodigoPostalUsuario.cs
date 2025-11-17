using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace centermuebles_tesis.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigoPostalUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoPostal",
                table: "Usuarios",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CodigoPostal",
                table: "Usuarios");
        }
    }
}
