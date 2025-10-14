using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using centermuebles_tesis.modelos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

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

        // POST: api/usuario/registro
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar([FromBody] UsuarioRegistro modelo)
        {
            try
            {
                // Verificar si el usuario ya existe
                if (await _context.Usuarios.AnyAsync(u => u.Email == modelo.Email))
                {
                    return BadRequest(new { mensaje = "El email ya está registrado" });
                }

                if (await _context.Usuarios.AnyAsync(u => u.NombreUsuario == modelo.NombreUsuario))
                {
                    return BadRequest(new { mensaje = "El nombre de usuario ya existe" });
                }

                // Crear nuevo usuario con BCrypt
                var usuario = new Usuario
                {
                    NombreUsuario = modelo.NombreUsuario,
                    Email = modelo.Email,
                    Contraseña = BCrypt.Net.BCrypt.HashPassword(modelo.Contraseña), // CORREGIDO: Contraseña
                    NombreCompleto = modelo.NombreCompleto ?? modelo.NombreUsuario, // Usa NombreUsuario si NombreCompleto es null
                    Telefono = modelo.Telefono,
                    Direccion = modelo.Direccion,
                    Rol = "Cliente" // Rol por defecto
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
                        email = usuario.Email
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
                var usuario = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.Email == modelo.Email || u.NombreUsuario == modelo.Email);

                if (usuario == null || !BCrypt.Net.BCrypt.Verify(modelo.Contraseña, usuario.Contraseña)) // CORREGIDO: Contraseña
                {
                    return Unauthorized(new { mensaje = "Email/usuario o contraseña incorrectos" });
                }

                // Generar token JWT
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
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.Email),
                new Claim(ClaimTypes.Name, usuario.NombreUsuario),
                new Claim(ClaimTypes.GivenName, usuario.NombreCompleto),
                new Claim(ClaimTypes.Role, usuario.Rol)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // Modelos para las peticiones
    public class UsuarioRegistro
    {
        public string NombreUsuario { get; set; }
        public string Email { get; set; }
        public string Contraseña { get; set; } // CORREGIDO: Contraseña
        public string? NombreCompleto { get; set; } // Ahora es opcional
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }
    }

    public class UsuarioLogin
    {
        public string Email { get; set; }
        public string Contraseña { get; set; } // CORREGIDO: Contraseña
    }
}