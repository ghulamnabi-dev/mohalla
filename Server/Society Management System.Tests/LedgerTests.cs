using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Society_Management_System.DTO;
using Society_Management_System.Models;

namespace Society_Management_System.Tests;

/// <summary>The money rules: ledger rows roll the closing balance forward, and back-dated entries don't crash.</summary>
public class LedgerTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public LedgerTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Payments_and_expenses_update_the_month_and_roll_into_the_next()
    {
        var admin = await _factory.Admin();
        var resident = await (await admin.PostAsJsonAsync("/api/Resident", Fixtures.Resident())).Content.ReadFromJsonAsync<Resident>();
        var category = await (await admin.PostAsJsonAsync("/api/ExpenseCategory", new ExpenseCategory { Name = "Security" })).Content.ReadFromJsonAsync<ExpenseCategory>();

        // January: 4,000 in, 1,500 out
        (await admin.PostAsJsonAsync("/api/MonthlySummary", new MonthlySummary { Month = 1, Year = 2030 })).EnsureSuccessStatusCode();
        (await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident!.Id, 1, 2030, 4000, 4000))).EnsureSuccessStatusCode();
        (await admin.PostAsJsonAsync("/api/MonthlyExpense", Fixtures.Expense(category!.Id, 1, 2030, 1500))).EnsureSuccessStatusCode();

        // February: opens with January's closing balance
        (await admin.PostAsJsonAsync("/api/MonthlySummary", new MonthlySummary { Month = 2, Year = 2030 })).EnsureSuccessStatusCode();
        (await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident.Id, 2, 2030, 4000, 2500))).EnsureSuccessStatusCode();

        var jan = await admin.GetFromJsonAsync<MonthlySummary>("/api/MonthlySummary/month/1/year/2030");
        var feb = await admin.GetFromJsonAsync<MonthlySummary>("/api/MonthlySummary/month/2/year/2030");

        jan!.TotalFund.Should().Be(4000);
        jan.Expense.Should().Be(1500);
        jan.ClosingBalance.Should().Be(2500);
        feb!.OpenningBalance.Should().Be(2500);
        feb.TotalFund.Should().Be(2500);
        feb.ClosingBalance.Should().Be(5000);
    }

    [Fact]
    public async Task A_back_dated_payment_creates_the_missing_ledger_row()
    {
        var admin = await _factory.Admin();
        var resident = await (await admin.PostAsJsonAsync("/api/Resident", Fixtures.Resident("Back Dated", "77"))).Content.ReadFromJsonAsync<Resident>();

        var response = await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident!.Id, 6, 2029, 4000, 4000));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var row = await admin.GetFromJsonAsync<MonthlySummary>("/api/MonthlySummary/month/6/year/2029");
        row!.TotalFund.Should().Be(4000);
        row.ClosingBalance.Should().Be(4000);
    }

    [Fact]
    public async Task Resident_statement_totals_the_history()
    {
        var admin = await _factory.Admin();
        var resident = await (await admin.PostAsJsonAsync("/api/Resident", Fixtures.Resident("Statement Person", "88"))).Content.ReadFromJsonAsync<Resident>();
        (await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident!.Id, 3, 2031, 4000, 4000))).EnsureSuccessStatusCode();
        (await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident.Id, 4, 2031, 4000, 1000))).EnsureSuccessStatusCode();

        var statement = await admin.GetFromJsonAsync<ResidentStatementDto>($"/api/Resident/{resident.Id}/statement");

        statement!.TotalDue.Should().Be(8000);
        statement.TotalPaid.Should().Be(5000);
        statement.Balance.Should().Be(3000);
        statement.MonthsPaid.Should().Be(1);
        statement.MonthsShort.Should().Be(1);
    }

    [Fact]
    public async Task Fund_search_pages_and_filters()
    {
        var admin = await _factory.Admin();
        var resident = await (await admin.PostAsJsonAsync("/api/Resident", Fixtures.Resident("Pager", "99"))).Content.ReadFromJsonAsync<Resident>();
        for (var m = 1; m <= 7; m++)
            (await admin.PostAsJsonAsync("/api/MonthlyFund", Fixtures.Fund(resident!.Id, m, 2032, 4000, 4000))).EnsureSuccessStatusCode();

        var page = await admin.GetFromJsonAsync<PagedResult<FundRowDto>>($"/api/MonthlyFund/search?year=2032&residentId={resident!.Id}&page=2&pageSize=3");

        page!.Total.Should().Be(7);
        page.TotalPages.Should().Be(3);
        page.Items.Should().HaveCount(3);
        page.Items.Should().OnlyContain(i => i.ResidentName == "Pager");
        page.Items.Select(i => i.Month).Should().BeInDescendingOrder();
    }

    [Fact]
    public async Task Invalid_fund_is_rejected_with_field_errors()
    {
        var admin = await _factory.Admin();

        var response = await admin.PostAsJsonAsync("/api/MonthlyFund", new MonthlyFund { Month = 13, Year = 2030, DatePaid = 0, PaidTo = "", Amount = 0, ResidentId = 0 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.Content.ReadFromJsonAsync<ValidationProblem>();
        problem!.Errors.Should().ContainKey("Month");
        problem.Errors.Should().ContainKey("PaidTo");
    }
}
