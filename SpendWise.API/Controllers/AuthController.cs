using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SpendWise.API.Models;
using SpendWise.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace SpendWise.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IMongoCollection<User> _usersCollection;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

        public AuthController(IMongoDatabase database, IConfiguration configuration, EmailService emailService)
        {
            _usersCollection = database.GetCollection<User>("users");
            _configuration = configuration;
            _emailService = emailService;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] User userDto)
        {
            // Validate input
            if (string.IsNullOrEmpty(userDto.Username) || string.IsNullOrEmpty(userDto.Email) || string.IsNullOrEmpty(userDto.Password))
            {
                return BadRequest(new { message = "Username, email, and password are required" });
            }

            // Email format validation
            var emailRegex = new System.Text.RegularExpressions.Regex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$");
            if (!emailRegex.IsMatch(userDto.Email))
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Check if user exists
            var existingUser = await _usersCollection.Find(u => u.Email == userDto.Email.ToLower()).FirstOrDefaultAsync();
            if (existingUser != null)
            {
                return BadRequest(new { message = "User already exists with this email" });
            }

            // Hash password
            userDto.Password = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
            userDto.Email = userDto.Email.ToLower();
            userDto.ProfilePicture = "";
            userDto.EmailNotifications = true;
            userDto.CreatedAt = DateTime.UtcNow;
            userDto.UpdatedAt = DateTime.UtcNow;

            // Save user
            await _usersCollection.InsertOneAsync(userDto);

            // Generate JWT token
            var token = GenerateJwtToken(userDto.Id);

            // Send welcome email in background
            _ = Task.Run(() => _emailService.SendWelcomeEmail(userDto.Email, userDto.Username));

            return StatusCode(201, new
            {
                token,
                user = new
                {
                    id = userDto.Id,
                    username = userDto.Username,
                    email = userDto.Email,
                    profilePicture = userDto.ProfilePicture,
                    emailNotifications = userDto.EmailNotifications
                }
            });
        }

        [HttpPost("signin")]
        public async Task<IActionResult> SignIn([FromBody] SignInDto signInDto)
        {
            // Validate input
            if (string.IsNullOrEmpty(signInDto.Email) || string.IsNullOrEmpty(signInDto.Password))
            {
                return BadRequest(new { message = "Email and password are required" });
            }

            // Find user
            var user = await _usersCollection.Find(u => u.Email == signInDto.Email).FirstOrDefaultAsync();
            if (user == null)
            {
                return BadRequest(new { message = "Invalid credentials" });
            }

            // Verify password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(signInDto.Password, user.Password);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Invalid credentials" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user.Id);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    profilePicture = user.ProfilePicture
                }
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                profilePicture = user.ProfilePicture
            });
        }

        [HttpPost("profile-picture")]
        [Authorize]
        public async Task<IActionResult> UploadProfilePicture(IFormFile profilePicture)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            if (profilePicture == null || profilePicture.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (!allowedTypes.Contains(profilePicture.ContentType))
            {
                return BadRequest(new { message = "Only JPEG and PNG images are allowed" });
            }

            // Create uploads directory if it doesn't exist
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"{userId}_{DateTime.Now.Ticks}{Path.GetExtension(profilePicture.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await profilePicture.CopyToAsync(stream);
            }

            // Update user profile picture in database
            var relativePath = $"/uploads/{fileName}";
            var update = Builders<User>.Update.Set(u => u.ProfilePicture, relativePath);
            await _usersCollection.UpdateOneAsync(u => u.Id == userId, update);

            // Get updated user
            var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();

            return Ok(new
            {
                message = "Profile picture uploaded successfully",
                user = new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    profilePicture = user.ProfilePicture
                }
            });
        }

        private string GenerateJwtToken(string userId)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? ""));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            Console.WriteLine($"Generated token for user {userId}: {tokenString.Substring(0, 20)}...");
            return tokenString;
        }
    }

    public class SignInDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}