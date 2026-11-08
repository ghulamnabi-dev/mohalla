using Microsoft.EntityFrameworkCore;
using Society_Management_System.Models;

namespace Society_Management_System.Repositories
{
    public interface IMonthlyExpenseRepository
    {
        Task<List<MonthlyExpense>> GetAllExpenses();
        Task<MonthlyExpense> GetExpenseById(int id);
        Task<List<MonthlyExpense>> GetExpenseByMonthAndYear(int month, int year);
        Task<MonthlyExpense> AddExpense(MonthlyExpense expense);
        Task<MonthlyExpense> UpdateExpense(MonthlyExpense expense);
        Task<bool> DeleteExpense(int id);
    }
    public class MonthlyExpenseRepository : IMonthlyExpenseRepository
    {
        private readonly SMSContext _context;

        public MonthlyExpenseRepository(SMSContext context)
        {
            _context = context;
        }

        public async Task<List<MonthlyExpense>> GetAllExpenses()
        {
            return await _context.MonthlyExpenses.ToListAsync();
        }

        public async Task<MonthlyExpense> GetExpenseById(int Id)
        {
            return await _context.MonthlyExpenses.FirstOrDefaultAsync(e => e.Id == Id);
        }

        public async Task<MonthlyExpense> AddExpense(MonthlyExpense expense)
        {
            _context.MonthlyExpenses.Add(expense);
            await _context.SaveChangesAsync();
            return expense;
        }

        public async Task<MonthlyExpense> UpdateExpense(MonthlyExpense expense)
        {
            var existing = await GetExpenseById(expense.Id);
            if (existing != null)
            {
                existing.Amount = expense.Amount;
                existing.Description = expense.Description;
                existing.Month = expense.Month;
                existing.Year = expense.Year;
                existing.ExpenseDate = expense.ExpenseDate;
                existing.CategoryId = expense.CategoryId;

                await _context.SaveChangesAsync();
                return existing;
            }
            return null;
        }

        public async Task<bool> DeleteExpense(int id)
        {
            var expense = await GetExpenseById(id);
            if (expense != null)
            {
                _context.MonthlyExpenses.Remove(expense);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }
        public async Task<List<MonthlyExpense>> GetExpenseByMonthAndYear(int month, int year)
        {
            List<MonthlyExpense> MonthlyExpenses = await  _context.MonthlyExpenses.Where(e => e.Month == month && e.Year == year).ToListAsync();
            return MonthlyExpenses;
        }
    }
}
