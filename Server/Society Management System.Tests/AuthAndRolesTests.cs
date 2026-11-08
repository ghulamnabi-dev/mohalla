using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Society_Management_System.DTO;
using Society_Management_System.Models;

namespace Society_Management_System.Tests;

public class AuthAndRolesTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AuthAndRolesTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task The_existing_admin_is_admin_and_new_accounts_are_viewers()
    {
        var admin = await _factory.Admin();
        var viewer = await _factory.ClientFor("second@example.com");

        var me1 = await admin.GetFromJsonAsync<CurrentUserDto>("/api/Auth/me");
        var me2 = await viewer.GetFromJsonAsync<CurrentUserDto>("/api/Auth/me");

        me1!.Role.Should().Be(Roles.Admin);
        me2!.Role.Should().Be(Roles.Viewer);
    }

    [Fact]
    public async Task On_an_empty_database_the_first_account_becomes_admin()
    {
        // A fresh factory = a fresh database with only the seeded admin removed from the picture:
        // register through a brand-new, unseeded app to exercise the bootstrap rule.
        await using var fresh = new ApiFactory(seedAdmin: false);
        var first = await fresh.ClientFor("founder@example.com");
        var second = await fresh.ClientFor("member@example.com");

        (await first.GetFromJsonAsync<CurrentUserDto>("/api/Auth/me"))!.Role.Should().Be(Roles.Admin);
        (await second.GetFromJsonAsync<CurrentUserDto>("/api/Auth/me"))!.Role.Should().Be(Roles.Viewer);
    }

    [Fact]
    public async Task Anonymous_requests_to_data_endpoints_are_rejected()
    {
        var response = await _factory.CreateClient().GetAsync("/api/Resident");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Viewers_can_read_but_not_write()
    {
        var viewer = await _factory.ClientFor("reader@example.com");

        var read = await viewer.GetAsync("/api/Resident");
        var write = await viewer.PostAsJsonAsync("/api/Resident", Fixtures.Resident());

        read.StatusCode.Should().Be(HttpStatusCode.OK);
        write.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_can_promote_a_viewer_but_not_change_their_own_role()
    {
        var admin = await _factory.Admin();
        await _factory.ClientFor("newbie@example.com");

        var users = await admin.GetFromJsonAsync<List<UserSummaryDto>>("/api/Auth/users");
        var me = users!.Single(u => u.Email == ApiFactory.AdminEmail);
        var newbie = users.Single(u => u.Email == "newbie@example.com");

        var promote = await admin.PutAsJsonAsync($"/api/Auth/users/{newbie.Id}/role", new ChangeRoleDto { Role = Roles.Admin });
        var selfDemote = await admin.PutAsJsonAsync($"/api/Auth/users/{me.Id}/role", new ChangeRoleDto { Role = Roles.Viewer });

        promote.StatusCode.Should().Be(HttpStatusCode.NoContent);
        selfDemote.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Invalid_registration_returns_field_errors()
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/Auth/register", new { fullName = "", email = "not-an-email", password = "short", confirmPassword = "different" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblem>();
        problem!.Errors.Keys.Should().Contain(k => k.Equals("Email", StringComparison.OrdinalIgnoreCase));
    }
}
