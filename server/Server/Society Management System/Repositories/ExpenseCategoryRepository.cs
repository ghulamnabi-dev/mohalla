using Society_Management_System.Models;
using Microsoft.EntityFrameworkCore;

namespace Society_Management_System.Repositories
{
    public interface IExpenseCategoryRepository
    {
        Task<List<ExpenseCategory>> GetAllCategories();
        Task<ExpenseCategory> GetCategoryById(int id);
        Task<ExpenseCategory> AddCategory(ExpenseCategory category);
        Task<ExpenseCategory> UpdateCategory(ExpenseCategory category);
        Task<bool> DeleteCategory(int id);

    }
    public class ExpenseCategoryRepository : IExpenseCategoryRepository
    {
        private readonly SMSContext _context;

        public ExpenseCategoryRepository(SMSContext context)
        {
            _context = context;
        }

        public async Task<List<ExpenseCategory>> GetAllCategories()
        {
            return await _context.ExpenseCategories.ToListAsync();
        }

        public async Task<ExpenseCategory> GetCategoryById(int id)
        {
            return await _context.ExpenseCategories.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<ExpenseCategory> AddCategory(ExpenseCategory category)
        {
            _context.ExpenseCategories.Add(category);
            await _context.SaveChangesAsync();
            return category;
        }

        public async Task<ExpenseCategory> UpdateCategory(ExpenseCategory category)
        {
            var existing = await GetCategoryById(category.Id);
            if (existing != null)
            {
                existing.Name = category.Name;
                await _context.SaveChangesAsync();
                return existing;
            }
            return null;
        }

        public async Task<bool> DeleteCategory(int id)
        {
            var category = await GetCategoryById(id);
            if (category != null)
            {
                _context.ExpenseCategories.Remove(category);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }
    }
}
