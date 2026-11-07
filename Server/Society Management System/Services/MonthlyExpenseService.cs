using Society_Management_System.Models;
using Society_Management_System.Repositories;

namespace Society_Management_System.Services
{
    public interface IMonthlyExpenseService
    {
        Task<List<MonthlyExpense>> GetAllExpenses();
        Task<MonthlyExpense> GetExpenseById(int id);
        Task<List<MonthlyExpense>> GetExpenseByMonthAndYear(int month, int year);
        Task<MonthlyExpense> AddExpense(MonthlyExpense expense);
        Task<MonthlyExpense> UpdateExpense(MonthlyExpense expense);
        Task<bool> DeleteExpense(int id);
    }
    public class MonthlyExpenseService : IMonthlyExpenseService
    {
        private readonly IMonthlyExpenseRepository _expenseRepository;
        private readonly IMonthlySummaryRepository _summaryRepository;

        public MonthlyExpenseService(IMonthlyExpenseRepository expenseRepository,IMonthlySummaryRepository summaryRepository)
        {
            _expenseRepository = expenseRepository;
            _summaryRepository = summaryRepository;
           
        }

        public async Task<List<MonthlyExpense>> GetAllExpenses()
        {
            return await _expenseRepository.GetAllExpenses();
        }

        public async Task<MonthlyExpense> GetExpenseById(int id)
        {
            return await _expenseRepository.GetExpenseById(id);
        }

        public async Task<List<MonthlyExpense>> GetExpenseByMonthAndYear(int month, int year)
        {
            return await _expenseRepository.GetExpenseByMonthAndYear(month, year);
        }

        public async Task<MonthlyExpense> AddExpense(MonthlyExpense expense)
        {
            await UpdateSummaryExpense(expense.Month,expense.Year,expense.Amount);

            return await _expenseRepository.AddExpense(expense);
        }

        public async Task<MonthlyExpense> UpdateExpense(MonthlyExpense expense)
        {
            MonthlyExpense Found = await GetExpenseById(expense.Id);
            await UpdateSummaryExpense(expense.Month, expense.Year, -(Found.Amount));
            await UpdateSummaryExpense(expense.Month, expense.Year, expense.Amount);
            return await _expenseRepository.UpdateExpense(expense);
        }

        public async Task<bool> DeleteExpense(int id)
        {
            MonthlyExpense expense =await  GetExpenseById(id);
            await UpdateSummaryExpense(expense.Month, expense.Year, -(expense.Amount));
            return await _expenseRepository.DeleteExpense(id);
        }
        private async Task UpdateSummaryExpense(int month, int year, int expense)
        {
            // Back-dated entries may target a month whose ledger row has not been generated yet.
            var summary = await _summaryRepository.GetOrCreateMonthlySummary(month, year);
            int id = summary.Id;
            await _summaryRepository.UpdateMonthlySummaryExpense(id, expense);
            summary.ClosingBalance = (summary.OpenningBalance + summary.TotalFund) - summary.Expense;
        }
    }
}
