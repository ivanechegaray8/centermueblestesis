using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace centermuebles_tesis.Migrations
{
    /// <inheritdoc />
    public partial class CambiarEstadoVentaPorDefecto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "EstadoVenta",
                table: "Ventas",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true,
                defaultValue: "Pendiente",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "Completada");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "EstadoVenta",
                table: "Ventas",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true,
                defaultValue: "Completada",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldNullable: true,
                oldDefaultValue: "Pendiente");
        }
    }
}
