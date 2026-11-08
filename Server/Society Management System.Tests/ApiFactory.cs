using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Society_Management_System;
using Society_Management_System.DTO;
using Society_Management_System.Models;

namespace Society_Management_System.Tests;

/// <summary>
/// Boots the real API against an in-memory SQLite database (one per factory) with Hangfire switched off.
/// The database is seeded with one administrator (<see cref="AdminEmail"/>); every account the tests
/// register afterwards is therefore a Viewer, which keeps the tests independent of execution order.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    // Keeping one open connection alive is what keeps an in-memory SQLite database alive.
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public const string AdminEmail = "admin@example.com";
    public const string Password = "Str0ng#Password";
    private readonly bool _seedAdmin;

    public ApiFactory() : this(seedAdmin: true) { }

    public ApiFactory(bool seedAdmin)
    {
        _seedAdmin = seedAdmin;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        _connection.Open();

        builder.UseEnvironment("Development");
        builder.UseSetting("Database:Provider", "Sqlite");
        builder.UseSetting("ConnectionStrings:DefaultConnection", _connection.ConnectionString);
        builder.UseSetting("Hangfire:Enabled", "false");
        builder.UseSetting("JWT:Secret", "integration-test-secret-key-that-is-long-enough-0123456789");
        builder.UseSetting("JWT:Issuer", "SocietyManagementStudio");
        builder.UseSetting("JWT:Audience", "SMSClients");

        builder.ConfigureServices(services =>
        {
            // Re-point the context at the shared connection so every scope sees the same database.
            services.RemoveAll<DbContextOptions<SMSContext>>();
            services.AddDbContext<SMSContext>(o => o.UseSqlite(_connection));

            using var scope = services.BuildServiceProvider().CreateScope();
            scope.ServiceProvider.GetRequiredService<SMSContext>().Database.EnsureCreated();
            if (_seedAdmin) SeedAdmin(scope.ServiceProvider).GetAwaiter().GetResult();
        });
    }

    /// <summary>A client signed in as the seeded administrator.</summary>
    public async Task<HttpClient> Admin()
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/Auth/login", new LoginDto { Email = AdminEmail, Password = Password });
        response.EnsureSuccessStatusCode();
        return Authed(client, await response.Content.ReadFromJsonAsync<AuthResponseDto>());
    }

    /// <summary>Registers a new account (a Viewer, since an admin already exists) and returns a signed-in client.</summary>
    public async Task<HttpClient> ClientFor(string email, string password = Password)
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/Auth/register", new RegisterDto
        {
            FullName = email.Split('@')[0],
            Email = email,
            Password = password,
            ConfirmPassword = password,
        });
        response.EnsureSuccessStatusCode();
        return Authed(client, await response.Content.ReadFromJsonAsync<AuthResponseDto>());
    }

    private static HttpClient Authed(HttpClient client, AuthResponseDto? auth)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    private static async Task SeedAdmin(IServiceProvider services)
    {
        var roles = services.GetRequiredService<RoleManager<IdentityRole>>();
        foreach (var role in Roles.All)
        {
            if (!await roles.RoleExistsAsync(role)) await roles.CreateAsync(new IdentityRole(role));
        }

        var users = services.GetRequiredService<UserManager<User>>();
        var admin = new User { UserName = AdminEmail, Email = AdminEmail, FullName = "Seeded Admin" };
        var created = await users.CreateAsync(admin, Password);
        if (!created.Succeeded) throw new InvalidOperationException(string.Join("; ", created.Errors.Select(e => e.Description)));
        await users.AddToRoleAsync(admin, Roles.Admin);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _connection.Dispose();
    }
}

internal static class ServiceCollectionExtensions
{
    public static void RemoveAll<T>(this IServiceCollection services)
    {
        foreach (var d in services.Where(d => d.ServiceType == typeof(T)).ToList()) services.Remove(d);
    }
}
