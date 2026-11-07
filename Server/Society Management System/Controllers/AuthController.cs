using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Society_Management_System.DTO;
using Society_Management_System.Models;
using Society_Management_System.Services;

namespace Society_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>Create an account and sign in. The first account becomes Admin.</summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            var (succeeded, errors) = await _authService.RegisterUser(dto);
            if (!succeeded)
            {
                foreach (var error in errors) ModelState.AddModelError(string.Empty, error);
                return ValidationProblem(ModelState);
            }

            var response = await _authService.Login(new LoginDto { Email = dto.Email, Password = dto.Password });
            return response == null ? Problem("Account created but sign-in failed.") : Ok(response);
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto login)
        {
            var response = await _authService.Login(login);
            return response == null ? Unauthorized(new ProblemDetails { Title = "Incorrect e-mail or password.", Status = 401 }) : Ok(response);
        }

        /// <summary>The signed-in user's profile and role.</summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<CurrentUserDto>> Me()
        {
            var me = await _authService.GetCurrentUser(UserId());
            return me == null ? NotFound() : Ok(me);
        }

        /// <summary>All accounts with their roles. Admin only.</summary>
        [HttpGet("users")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<List<UserSummaryDto>>> Users() => Ok(await _authService.GetUsers());

        /// <summary>Promote or demote an account. Admin only; you cannot change your own role.</summary>
        [HttpPut("users/{id}/role")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ChangeRole(string id, ChangeRoleDto dto)
        {
            var (succeeded, error) = await _authService.ChangeRole(id, dto.Role, UserId());
            return succeeded ? NoContent() : BadRequest(new ProblemDetails { Title = error, Status = 400 });
        }

        private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}
