using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace centermuebles_tesis.modelos;

public partial class CentermueblesContext : DbContext
{
    // Constructor vacío
    public CentermueblesContext()
    {
    }

    // Constructor que recibe opciones (como la cadena de conexión)
    public CentermueblesContext(DbContextOptions<CentermueblesContext> options)
        : base(options)
    {
    }

    // TABLAS EXISTENTES - SIN PAGOS
    public virtual DbSet<Categorias> Categorias { get; set; }
    public virtual DbSet<DetalleVentas> DetalleVentas { get; set; }
    public virtual DbSet<Producto> Productos { get; set; }
    public virtual DbSet<Subcategorias> Subcategorias { get; set; }
    public virtual DbSet<Usuario> Usuarios { get; set; }
    public virtual DbSet<Venta> Ventas { get; set; }
    public virtual DbSet<CarritoCompras> CarritoCompras { get; set; }
    public virtual DbSet<ImagenProducto> ImagenesProducto { get; set; }

    // Configuración de tablas, columnas y relaciones
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categorias>(entity =>
        {
            entity.HasKey(e => e.IdCategoria);
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Subcategorias>(entity =>
        {
            entity.HasKey(e => e.IdSubcategoria);
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false);

            // Relación con Categoria
            entity.HasOne(d => d.IdCategoriaNavigation)
                .WithMany(p => p.Subcategorias)
                .HasForeignKey(d => d.IdCategoria)
                .HasConstraintName("FK_Subcategorias_Categorias");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.IdProducto);
            entity.Property(e => e.Nombre)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Precio).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Descripcion).HasColumnType("text");
            entity.Property(e => e.RutaImagen)
                .HasMaxLength(255)
                .IsUnicode(false);

            // SOLO relación con Subcategoria
            entity.HasOne(d => d.IdSubcategoriaNavigation)
                .WithMany(p => p.Productos)
                .HasForeignKey(d => d.IdSubcategoria)
                .HasConstraintName("FK_Productos_Subcategorias");
        });

        // Configuración de ImagenProducto
        modelBuilder.Entity<ImagenProducto>(entity =>
        {
            entity.HasKey(e => e.IdImagen);

            entity.Property(e => e.RutaImagen)
                .IsRequired()
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.Property(e => e.NombreArchivo)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.ImagenPrincipal)
                .HasDefaultValue(false);

            entity.Property(e => e.Orden)
                .HasDefaultValue(0);

            // Relación con Producto
            entity.HasOne(d => d.Producto)
                .WithMany(p => p.ImagenesProducto)
                .HasForeignKey(d => d.IdProducto)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ImagenesProducto_Productos");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.IdUsuario);
            entity.Property(e => e.NombreUsuario)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Contraseña)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.NombreCompleto)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.Direccion).HasColumnType("text");
            entity.Property(e => e.Rol)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Cliente");

            // Índices únicos
            entity.HasIndex(e => e.NombreUsuario).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.HasKey(e => e.IdVenta);
            entity.Property(e => e.FechaVenta)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TotalVenta).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.EstadoVenta)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Pendiente"); // ← CAMBIADO de "Completada" a "Pendiente"
            entity.Property(e => e.MetodoPago)
                .HasMaxLength(50)
                .IsUnicode(false);

            // SOLO relación con Usuario
            entity.HasOne(d => d.IdUsuarioNavigation)
                .WithMany(p => p.Ventas)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("FK_Ventas_Usuarios");
        });

        modelBuilder.Entity<DetalleVentas>(entity =>
        {
            entity.HasKey(e => e.IdDetalle);
            entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.SubTotal).HasColumnType("decimal(10, 2)");

            // Relación con Venta
            entity.HasOne(d => d.IdVentaNavigation)
                .WithMany(p => p.DetalleVentas)
                .HasForeignKey(d => d.IdVenta)
                .HasConstraintName("FK_DetalleVentas_Ventas");

            // Relación con Producto
            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.DetalleVentas)
                .HasForeignKey(d => d.IdProducto)
                .HasConstraintName("FK_DetalleVentas_Productos");
        });

        modelBuilder.Entity<CarritoCompras>(entity =>
        {
            entity.HasKey(e => e.IdCarrito);
            entity.Property(e => e.IdSesion)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.FechaAgregado)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            // Relación con Usuario (opcional)
            entity.HasOne(d => d.IdUsuarioNavigation)
                .WithMany(p => p.CarritoCompras)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("FK_CarritoCompras_Usuarios");

            // Relación con Producto
            entity.HasOne(d => d.IdProductoNavigation)
                .WithMany(p => p.CarritoCompras)
                .HasForeignKey(d => d.IdProducto)
                .HasConstraintName("FK_CarritoCompras_Productos");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}