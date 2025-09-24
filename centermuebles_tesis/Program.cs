using centermuebles_tesis.modelos;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization; // ?? IMPORTANTE

var builder = WebApplication.CreateBuilder(args);

// MODIFICADO: Habilitamos controladores API DESHABILITANDO validación automática
builder.Services.AddControllers()
    .AddJsonOptions(x =>
    {
        // ?? IGNORA ciclos en relaciones (solución rápida al error de serialización)
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        x.JsonSerializerOptions.WriteIndented = true; // (opcional: hace el JSON más legible)
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // DESHABILITA la validación automática del modelo
        options.SuppressModelStateInvalidFilter = true;
    });

// Habilitamos CORS para permitir conexiones desde cualquier frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// CORRECCIÓN: Usar el nombre correcto de la cadena de conexión
builder.Services.AddDbContext<CentermueblesContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CentermueblesContext")));

var app = builder.Build();

// Habilitamos CORS con la política definida
app.UseCors("PermitirTodo");

// Habilitamos archivos estáticos (HTML, CSS, JS, imágenes)
app.UseStaticFiles();

// Configuramos ruteo
app.UseRouting();

// Mapear API Controllers
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

// Mapear la raíz "/" a index.html
app.MapGet("/", (IWebHostEnvironment env) =>
{
    var path = Path.Combine(env.ContentRootPath, "wwwroot", "index.html");
    return Results.File(path, "text/html");
});

// Ejecutar la aplicación
app.Run();
