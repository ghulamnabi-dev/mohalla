using Society_Management_System.Models;
using Society_Management_System.Repositories;

namespace Society_Management_System.Services
{
    public interface IExpenseCategoryService
    {
        Task<List<ExpenseCategory>> GetAllCategories();
        Task<ExpenseCategory> GetCategoryById(int id);
        Task<ExpenseCategory> AddCategory(ExpenseCategory category);
        Task<ExpenseCategory> UpdateCategory(ExpenseCategory category);
        Task<bool> DeleteCategory(int id);
    }
    public class ExpenseCategoryService : IExpenseCategoryService
    {
        private readonly IExpenseCategoryRepository _categoryRepository;

        public ExpenseCategoryService(IExpenseCategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<List<ExpenseCategory>> GetAllCategories()
        {
            return await _categoryRepository.GetAllCategories();
        }

        public async Task<ExpenseCategory> GetCategoryById(int id)
        {
            return await _categoryRepository.GetCategoryById(id);
        }

        public async Task<ExpenseCategory> AddCategory(ExpenseCategory category)
        {
            return await _categoryRepository.AddCategory(category);
        }

        public async Task<ExpenseCategory> UpdateCategory(ExpenseCategory category)
        {
            return await _categoryRepository.UpdateCategory(category);
        }

        public async Task<bool> DeleteCategory(int id)
        {
            return await _categoryRepository.DeleteCategory(id);
        }
    }
}
