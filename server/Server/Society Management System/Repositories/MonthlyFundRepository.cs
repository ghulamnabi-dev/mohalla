using Microsoft.EntityFrameworkCore;
using Society_Management_System.Models;

namespace Society_Management_System.Repositories
{
    public interface IMonthlyFundRepository
    {
        Task<List<MonthlyFund>> GetMonthlyFunds(); 
        Task<MonthlyFund> GetMonthlyFundById(int id);
        Task<MonthlyFund> AddMonthlyFund(MonthlyFund monthlyFund);
        Task<MonthlyFund> UpdateMonthlyFund(MonthlyFund monthlyFund);
        Task<List<MonthlyFund>> GetMonthlyFundsByResidentId(int residentId);
        Task<bool> DeleteMonthlyFund(int id);
    }
    public class MonthlyFundRepository : IMonthlyFundRepository
    {
        private readonly SMSContext _context;

        public MonthlyFundRepository(SMSContext context)
        {
            _context = context;
        }

        public async Task<List<MonthlyFund>> GetMonthlyFunds()
        {
            return await _context.MonthlyFunds.ToListAsync();
        }

        
        public async Task<MonthlyFund> GetMonthlyFundById(int id)
        {
            return await _context.MonthlyFunds.FirstOrDefaultAsync(mf => mf.Id == id);
        }

        
        public async Task<MonthlyFund> AddMonthlyFund(MonthlyFund monthlyFund)
        {
            _context.MonthlyFunds.Add(monthlyFund);
            await _context.SaveChangesAsync();
            return monthlyFund;
        }

        
        public async Task<MonthlyFund> UpdateMonthlyFund(MonthlyFund monthlyFund)
        {
            var existingFund = await GetMonthlyFundById(monthlyFund.Id);

            if (existingFund != null)
            {
                existingFund.Month = monthlyFund.Month;
                existingFund.Year = monthlyFund.Year;
                existingFund.DatePaid = monthlyFund.DatePaid;
                existingFund.PaidTo = monthlyFund.PaidTo;
                existingFund.Amount = monthlyFund.Amount;
                existingFund.PaidAmount = monthlyFund.PaidAmount;
                existingFund.Outstanding = monthlyFund.Outstanding;
                await _context.SaveChangesAsync();
                return existingFund;
            }
            return null; 
        }

        
        public async Task<List<MonthlyFund>> GetMonthlyFundsByResidentId(int residentId)
        {
            return await _context.MonthlyFunds.Where(mf => mf.ResidentId == residentId)
                .ToListAsync();
        }

      
        public async Task<bool> DeleteMonthlyFund(int id)
        {
            var fundToDelete = await GetMonthlyFundById(id);
            if (fundToDelete != null)
            {
                _context.MonthlyFunds.Remove(fundToDelete);
                await _context.SaveChangesAsync();
                return true;
            }
            return false; 
        }
    }
}

