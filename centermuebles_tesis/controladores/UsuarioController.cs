using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using centermuebles_tesis.modelos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.ComponentModel.DataAnnotations;

namespace centermuebles_tesis.controladores
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuarioController : ControllerBase
    {
        private readonly CentermueblesContext _context;
        private readonly IConfiguration _configuration;

        public UsuarioController(CentermueblesContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // GET: api/usuario
        [HttpGet]
        public async Task<IActionResult> GetUsuarios()
        {
            try
            {
                var usuarios = await _context.Usuarios
                    .Select(u => new {
                        id = u.IdUsuario,
                        nombreUsuario = u.NombreUsuario,
                        nombreCompleto = u.NombreCompleto,
                        email = u.Email,
                        telefono = u.Telefono,
                        direccion = u.Direccion,
                        codigoPostal = u.CodigoPostal,
                        rol = u.Rol
                    })
                    .ToListAsync();

                return Ok(usuarios);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/usuario/registro
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar([FromBody] UsuarioRegistro modelo)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verificar duplicados
                if (await _context.Usuarios.AnyAsync(u => u.Email == modelo.Email))
                    return BadRequest(new { mensaje = "El email ya está registrado" });

                if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario == modelo.NombreUsuario))
                    return BadRequest(new { mensaje = "El nombre de usuario ya existe" });

                var usuario = new Usuario
                {
                    NombreUsuario = modelo.NombreUsuario,
                    Email = modelo.Email,
                    Contraseña = BCrypt.Net.BCrypt.HashPassword(modelo.Contraseña),
                    NombreCompleto = modelo.NombreCompleto ?? modelo.NombreUsuario,
                    Telefono = modelo.Telefono,
                    Direccion = modelo.Direccion,
                    CodigoPostal = modelo.CodigoPostal,
                    Rol = "Cliente"
                };

                _context.Usuarios.Add(usuario);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    mensaje = "Usuario registrado exitosamente",
                    usuario = new
                    {
                        id = usuario.IdUsuario,
                        nombreUsuario = usuario.NombreUsuario,
                        nombreCompleto = usuario.NombreCompleto,
                        email = usuario.Email,
                        telefono = usuario.Telefono,
                        direccion = usuario.Direccion,
                        codigoPostal = usuario.CodigoPostal
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
            }
        }

        // POST: api/usuario/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UsuarioLogin modelo)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == modelo.Email || u.NombreUsuario == modelo.Email);

                if (usuario == null || !BCrypt.Net.BCrypt.Verify(modelo.Contraseña, usuario.Contraseña))
                    return Unauthorized(new { mensaje = "Email/usuario o contraseña incorrectos" });

                var token = GenerarTokenJWT(usuario);

                return Ok(new
                {
                    token = token,
                    usuario = new
                    {
                        id = usuario.IdUsuario,
                        nombreUsuario = usuario.NombreUsuario,
                        nombreCompleto = usuario.NombreCompleto,
                        email = usuario.Email,
                        telefono = usuario.Telefono,
                        direccion = usuario.Direccion,
                        codigoPostal = usuario.CodigoPostal,
                        rol = usuario.Rol
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
            }
        }

        // GET: api/usuario/perfil
        [HttpGet("perfil")]
        public async Task<IActionResult> ObtenerPerfil()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var usuario = await _context.Usuarios
                    .Where(u => u.IdUsuario == int.Parse(userId))
                    .Select(u => new {
                        id = u.IdUsuario,
                        nombreUsuario = u.NombreUsuario,
                        nombreCompleto = u.NombreCompleto,
                        email = u.Email,
                        telefono = u.Telefono,
                        direccion = u.Direccion,
                        codigoPostal = u.CodigoPostal,
                        rol = u.Rol
                    })
                    .FirstOrDefaultAsync();

                if (usuario == null)
                    return NotFound();

                return Ok(usuario);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mensaje = "Error interno del servidor", error = ex.Message });
            }
        }

        private string GenerarTokenJWT(Usuario usuario)
        {
            try
            {
                var jwtKey = _configuration["Jwt:Key"];
                var jwtIssuer = _configuration["Jwt:Issuer"];
                var jwtAudience = _configuration["Jwt:Audience"];

                if (string.IsNullOrEmpty(jwtKey))
                    throw new ArgumentException("La clave JWT no está configurada");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                    new Claim(ClaimTypes.Email, usuario.Email ?? ""),
                    new Claim(ClaimTypes.Name, usuario.NombreUsuario ?? ""),
                    new Claim(ClaimTypes.GivenName, usuario.NombreCompleto ?? ""),
                    new Claim(ClaimTypes.Role, usuario.Rol ?? "Cliente")
                };

                var token = new JwtSecurityToken(
                    issuer: jwtIssuer,
                    audience: jwtAudience,
                    claims: claims,
                    expires: DateTime.Now.AddHours(3),
                    signingCredentials: creds);

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error generando token JWT: {ex.Message}", ex);
            }
        }
    }

    // ✅ MODELOS CORREGIDOS
    public class UsuarioRegistro
    {
        [Required(ErrorMessage = "El nombre de usuario es obligatorio")]
        public string NombreUsuario { get; set; } = null!;

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "El email no es válido")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        public string Contraseña { get; set; } = null!;

        public string? NombreCompleto { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
        public string? CodigoPostal { get; set; }
    }

    public class UsuarioLogin
    {
        [Required(ErrorMessage = "El email o usuario es obligatorio")]
        // ✅ QUITADO: [EmailAddress(ErrorMessage = "El email no es válido")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        public string Contraseña { get; set; } = null!;
    }
}