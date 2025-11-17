using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace centermuebles_tesis.Migrations
{
    /// <inheritdoc />
    public partial class AgregarTablaImagenProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Categorias_CategoriasIdCategoria",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_Productos_CategoriasIdCategoria",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CategoriasIdCategoria",
                table: "Productos");

            migrationBuilder.CreateTable(
                name: "ImagenesProducto",
                columns: table => new
                {
                    IdImagen = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdProducto = table.Column<int>(type: "int", nullable: false),
                    RutaImagen = table.Column<string>(type: "varchar(500)", unicode: false, maxLength: 500, nullable: false),
                    NombreArchivo = table.Column<string>(type: "varchar(100)", unicode: false, maxLength: 100, nullable: true),
                    EsPrincipal = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    Orden = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImagenesProducto", x => x.IdImagen);
                    table.ForeignKey(
                        name: "FK_ImagenesProducto_Productos",
                        column: x => x.IdProducto,
                        principalTable: "Productos",
                        principalColumn: "IdProducto",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImagenesProducto_IdProducto",
                table: "ImagenesProducto",
                column: "IdProducto");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImagenesProducto");

            migrationBuilder.AddColumn<int>(
                name: "CategoriasIdCategoria",
                table: "Productos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Productos_CategoriasIdCategoria",
                table: "Productos",
                column: "CategoriasIdCategoria");

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Categorias_CategoriasIdCategoria",
                table: "Productos",
                column: "CategoriasIdCategoria",
                principalTable: "Categorias",
                principalColumn: "IdCategoria");
        }
    }
}
