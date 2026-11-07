using Society_Management_System.Models;

namespace Society_Management_System.Tests;

internal static class Fixtures
{
    public static Resident Resident(string name = "Ahmed Raza", string house = "12") =>
        new() { OwnerName = name, HouseNumber = house, Street = "Street 4", PhoneNumber = "03001234567" };

    public static MonthlyFund Fund(int residentId, int month, int year, int amount, int paid) =>
        new() { ResidentId = residentId, Month = month, Year = year, DatePaid = 5, PaidTo = "Treasurer", Amount = amount, PaidAmount = paid, Outstanding = amount - paid };

    public static MonthlyExpense Expense(int categoryId, int month, int year, int amount) =>
        new() { CategoryId = categoryId, Month = month, Year = year, ExpenseDate = 10, Description = "Guard salaries", Amount = amount };
}

/// <summary>Shape of ASP.NET Core's ValidationProblemDetails as serialised.</summary>
internal sealed class ValidationProblem
{
    public string? Title { get; set; }
    public int? Status { get; set; }
    public Dictionary<string, string[]> Errors { get; set; } = new();
}
