using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Society_Management_System.DTO;
using Society_Management_System.Models;

namespace Society_Management_System.Services
{
    public interface IAuthService
    {
        Task<(bool Succeeded, IEnumerable<string> Errors)> RegisterUser(RegisterDto dto);
        Task<AuthResponseDto?> Login(LoginDto login);
        Task<CurrentUserDto?> GetCurrentUser(string userId);
        Task<List<UserSummaryDto>> GetUsers();
        Task<(bool Succeeded, string? Error)> ChangeRole(string userId, string role, string actingUserId);
    }

    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ITokenService _tokenService;

        public AuthService(UserManager<User> userManager, RoleManager<IdentityRole> roleManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
        }

        public async Task<(bool Succeeded, IEnumerable<string> Errors)> RegisterUser(RegisterDto dto)
        {
            var user = new User
            {
                FullName = dto.FullName.Trim(),
                UserName = dto.Email.Trim().ToLowerInvariant(),
                Email = dto.Email.Trim().ToLowerInvariant(),
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return (false, result.Errors.Select(e => e.Description));
            }

            await EnsureRolesExist();

            // Whoever arrives while the society has no administrator becomes one (fresh database, or a
            // database created before roles existed); everyone after that starts read-only.
            var hasAdmin = (await _userManager.GetUsersInRoleAsync(Roles.Admin)).Count > 0;
            await _userManager.AddToRoleAsync(user, hasAdmin ? Roles.Viewer : Roles.Admin);

            return (true, Array.Empty<string>());
        }

        public async Task<AuthResponseDto?> Login(LoginDto login)
        {
            var user = await _userManager.FindByNameAsync(login.Email.Trim().ToLowerInvariant());
            if (user == null || !await _userManager.CheckPasswordAsync(user, login.Password))
            {
                return null;
            }

            await EnsureSomeoneIsAdmin(user);
            var role = await RoleOf(user);
            return new AuthResponseDto
            {
                Token = _tokenService.CreateToken(user, role),
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Role = role,
            };
        }

        public async Task<CurrentUserDto?> GetCurrentUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return null;
            return new CurrentUserDto { Id = user.Id, Email = user.Email ?? string.Empty, FullName = user.FullName, Role = await RoleOf(user) };
        }

        public async Task<List<UserSummaryDto>> GetUsers()
        {
            var users = await _userManager.Users.OrderBy(u => u.Email).ToListAsync();
            var list = new List<UserSummaryDto>(users.Count);
            foreach (var u in users)
            {
                list.Add(new UserSummaryDto { Id = u.Id, Email = u.Email ?? string.Empty, FullName = u.FullName, Role = await RoleOf(u) });
            }
            return list;
        }

        public async Task<(bool Succeeded, string? Error)> ChangeRole(string userId, string role, string actingUserId)
        {
            if (!Roles.All.Contains(role)) return (false, $"Unknown role '{role}'.");
            if (userId == actingUserId) return (false, "You cannot change your own role.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return (false, "User not found.");

            await EnsureRolesExist();
            var current = await _userManager.GetRolesAsync(user);
            await _userManager.RemoveFromRolesAsync(user, current);
            var result = await _userManager.AddToRoleAsync(user, role);
            return result.Succeeded ? (true, null) : (false, string.Join(" ", result.Errors.Select(e => e.Description)));
        }

        /// <summary>Upgrade path: accounts created before roles existed have none. The first to sign in takes Admin.</summary>
        private async Task EnsureSomeoneIsAdmin(User user)
        {
            await EnsureRolesExist();
            if ((await _userManager.GetUsersInRoleAsync(Roles.Admin)).Count == 0)
            {
                await _userManager.AddToRoleAsync(user, Roles.Admin);
            }
        }

        private async Task<string> RoleOf(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return roles.Contains(Roles.Admin) ? Roles.Admin : Roles.Viewer;
        }

        private async Task EnsureRolesExist()
        {
            foreach (var role in Roles.All)
            {
                if (!await _roleManager.RoleExistsAsync(role))
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }
    }
}
