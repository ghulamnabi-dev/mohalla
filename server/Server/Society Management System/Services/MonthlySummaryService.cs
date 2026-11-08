using Microsoft.EntityFrameworkCore;
using Society_Management_System.Models;
using Society_Management_System.Repositories;
using System;

namespace Society_Management_System.Services
{
    public interface IMonthlySummaryService
    {
        Task<List<MonthlySummary>> GetMonthlySummaries();
        Task<MonthlySummary> GetMonthlySummaryById(int id);
        Task<MonthlySummary> AddMonthlySummary(MonthlySummary summary);
        Task<MonthlySummary> UpdateMonthlySummary(MonthlySummary summary);
        Task<MonthlySummary> GetMonthlySummaryByMonthYear(int month, int year);
        Task GenerateSummaryForCurrentMonth();


        Task<bool> DeleteMonthlySummary(int id);
    }
    public class MonthlySummaryService : IMonthlySummaryService
    {
        private readonly IMonthlySummaryRepository _summaryRepository;
        private readonly IMonthlyExpenseService _expenseService;
        private readonly IMonthlyFundService _fundService;

        public MonthlySummaryService(IMonthlySummaryRepository summaryRepository, IMonthlyExpenseService expenseService, IMonthlyFundService fundService)
        {
            _summaryRepository = summaryRepository;
            _expenseService = expenseService;
            _fundService = fundService;
        }

        public async Task<List<MonthlySummary>> GetMonthlySummaries()
        {
            return await _summaryRepository.GetMonthlySummaries();
        }

        public async Task<MonthlySummary> GetMonthlySummaryById(int id)
        {

            return await _summaryRepository.GetMonthlySummaryById(id);
        }

        public async Task<MonthlySummary> AddMonthlySummary(MonthlySummary summary)
        {
            var MonthlyFunds = (await _fundService.GetAllFunds()).Where(f => f.Month == summary.Month && f.Year == summary.Year).Sum(f => f.PaidAmount);
            var MonthlyExpense = (await _expenseService.GetExpenseByMonthAndYear(summary.Month, summary.Year)).Sum(e => e.Amount);
            summary.TotalFund = MonthlyFunds;
            summary.Expense = MonthlyExpense;
            var Summaries = await _summaryRepository.GetMonthlySummaries();
            var YearlySummary = Summaries.Where(f => f.Year == summary.Year).ToList();
            if(Summaries.Count == 0)
            {
                summary.OpenningBalance = 0;
            }
            else if (YearlySummary.Count == 0)
            {
                summary.OpenningBalance = Summaries
                                           .Where(f => f.Year == summary.Year - 1 && f.Month == 12)
                                           .Select(f => f.ClosingBalance)
                                           .FirstOrDefault();
            }
            else
            {
                var previousMonth = summary.Month - 1;
                var previousSummary = Summaries
                    .FirstOrDefault(f => f.Year == summary.Year && f.Month == previousMonth);

                summary.OpenningBalance = previousSummary.ClosingBalance;
            }

            summary.ClosingBalance = (summary.OpenningBalance + summary.TotalFund) - summary.Expense;

            return await _summaryRepository.AddMonthlySummary(summary);
        }

        public async Task<MonthlySummary> UpdateMonthlySummary(MonthlySummary summary)
        {
            return await _summaryRepository.UpdateMonthlySummary(summary);
        }

        public async Task<MonthlySummary> GetMonthlySummaryByMonthYear(int month, int year)
        {

            
            return await _summaryRepository.GetMonthlySummaryByMonthYear(month, year);
        }

        public async Task<bool> DeleteMonthlySummary(int id)
        {
            return await _summaryRepository.DeleteMonthlySummary(id);
        }
        public async Task GenerateSummaryForCurrentMonth() {
            var now = DateTime.Now;
            var month = now.Month;
            var year = now.Year;
            var exists = await _summaryRepository.GetMonthlySummaryByMonthYear(month,year);
            if (exists == null) {
                var summary = new MonthlySummary
                {
                    Id=0,
                    Month = month,
                    Year = year,
                    OpenningBalance = 0,
                    Expense = 0,
                    ClosingBalance = 0,
                    TotalFund= 0,

                };
                await AddMonthlySummary(summary);


            }
        }
        }


    }
    