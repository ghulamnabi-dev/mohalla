
using Microsoft.EntityFrameworkCore;
using Society_Management_System.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace Society_Management_System
{
    public class SMSContext: IdentityDbContext<User>
    {
        public SMSContext(DbContextOptions options):base(options) {}
        public DbSet<MonthlyExpense> MonthlyExpenses { get; set; }
        public DbSet<MonthlyFund> MonthlyFunds { get; set; } 
        public DbSet<MonthlySummary> MonthlySummaries { get; set; }
        public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
        public DbSet<Resident> Resident { get; set; }
    }
}
