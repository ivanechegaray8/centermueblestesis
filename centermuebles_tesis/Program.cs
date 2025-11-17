using centermuebles_tesis.modelos;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// CONFIGURACIÓN DE CONTROLADORES
builder.Services.AddControllers()
    .AddJsonOptions(x =>
    {
        x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        x.JsonSerializerOptions.WriteIndented = true;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });

// HABILITAR SWAGGER
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CONFIGURACIÓN CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// CONFIGURACIÓN DB CONTEXT
builder.Services.AddDbContext<CentermueblesContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("CentermueblesContext")));

// CONFIGURACIÓN JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

var app = builder.Build();

// HABILITAR SWAGGER
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Center Muebles API V1");
    c.RoutePrefix = "swagger";
});

// ORDEN CORRECTO DE MIDDLEWARES
app.UseHttpsRedirection();
app.UseStaticFiles(); // ← ESTO DEBE IR PRIMERO
app.UseRouting();
app.UseCors("PermitirTodo");
app.UseAuthentication();
app.UseAuthorization();

// CONFIGURACIÓN DE ENDPOINTS
app.MapControllers();

// RUTA PARA HEALTH CHECK
app.MapGet("/health", () => Results.Ok("API saludable"));

// FALLBACK AL FRONTEND
app.MapFallbackToFile("index.html");

app.Run();