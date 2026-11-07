using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Society_Management_System;
using Society_Management_System.DTO;

namespace Society_Management_System.Tests;

/// <summary>
/// Boots the real API against an in-memory SQLite database (one per factory) with Hangfire switched off.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    // Keeping one open connection alive is what keeps an in-memory SQLite database alive.
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

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
        });
    }

    /// <summary>Registers a user and returns a client that sends their bearer token.</summary>
    public async Task<HttpClient> ClientFor(string email, string password = "Str0ng#Password")
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
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
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
