using Society_Management_System.Models;
using Society_Management_System.Repositories;


namespace Society_Management_System.Services
{
    public interface IMonthlyFundService
    {
        Task<List<MonthlyFund>> GetAllFunds();
        Task<MonthlyFund> GetFundById(int id);
        Task<MonthlyFund> CreateFund(MonthlyFund fund);
        Task<MonthlyFund> UpdateFund(MonthlyFund fund);
        Task<List<MonthlyFund>> GetFundsByResidentId(int residentId);
        Task<bool> DeleteFund(int id);
        Task<List<MonthlyFund>> GetFundsByMonth(int month);
    }
    public class MonthlyFundService : IMonthlyFundService
    {
        private readonly IMonthlyFundRepository _fundRepository;
        private readonly IMonthlySummaryRepository _summaryRepository;

        public MonthlyFundService(IMonthlyFundRepository fundRepository, IMonthlySummaryRepository summaryRepository)
        {
            _fundRepository = fundRepository;
            _summaryRepository = summaryRepository;
        }

        public async Task<List<MonthlyFund>> GetAllFunds()
        {
            return await _fundRepository.GetMonthlyFunds();
        }

        public async Task<MonthlyFund> GetFundById(int id)
        {
            return await _fundRepository.GetMonthlyFundById(id);
        }

        public async Task<MonthlyFund> CreateFund(MonthlyFund fund)
        {

            fund.Outstanding = await setOutsanding(fund.ResidentId) +(fund.Amount - fund.PaidAmount);
            await UpdateSummaryFund(fund.Month,fund.Year,fund.PaidAmount);
            return await _fundRepository.AddMonthlyFund(fund);
        }

        public async Task<MonthlyFund> UpdateFund(MonthlyFund fund)
        {
            MonthlyFund found =await GetFundById(fund.Id);
            await UpdateSummaryFund(fund.Month, fund.Year, -(found.PaidAmount));
            await UpdateSummaryFund(fund.Month, fund.Year, (fund.PaidAmount));
            return await _fundRepository.UpdateMonthlyFund(fund);
        }

        public async Task<List<MonthlyFund>> GetFundsByResidentId(int residentId)
        {
            return await _fundRepository.GetMonthlyFundsByResidentId(residentId);
        }

        public async Task<bool> DeleteFund(int id)
        {
            MonthlyFund fund= await GetFundById(id);
            await UpdateSummaryFund(fund.Month, fund.Year, -(fund.PaidAmount));
            return await _fundRepository.DeleteMonthlyFund(id);
        }
        private async Task<int> setOutsanding(int id)
        {
            var totalOutstanding = (await _fundRepository.GetMonthlyFundsByResidentId(id))
            .Sum(f => f.Amount - f.PaidAmount);
            if (totalOutstanding > 0)
            {
                return totalOutstanding;
            }
            else
            {
                return 0;
            }
        }
        public async Task<List<MonthlyFund>> GetFundsByMonth(int month)
        {
            return (await _fundRepository.GetMonthlyFunds()).Where(f=> f.Month == month).ToList();
        }
        private async Task UpdateSummaryFund(int month, int year, int fund)
        {
            // Back-dated entries may target a month whose ledger row has not been generated yet.
            var summary = await _summaryRepository.GetOrCreateMonthlySummary(month, year);
            int id = summary.Id;
            await _summaryRepository.UpdateMonthlySummaryFund(id, fund);
            summary.ClosingBalance = (summary.OpenningBalance + summary.TotalFund) - summary.Expense;

        }


    }
}
