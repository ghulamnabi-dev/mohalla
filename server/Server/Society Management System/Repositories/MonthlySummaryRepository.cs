using Microsoft.EntityFrameworkCore;
using Society_Management_System.Models;

namespace Society_Management_System.Repositories
{
    public interface IMonthlySummaryRepository
    {
        Task<List<MonthlySummary>> GetMonthlySummaries();
        Task<MonthlySummary> GetMonthlySummaryById(int id);
        Task<MonthlySummary> AddMonthlySummary(MonthlySummary summary);
        Task<MonthlySummary> UpdateMonthlySummary(MonthlySummary summary);
        Task<MonthlySummary> GetMonthlySummaryByMonthYear(int month, int year);
        /// <summary>Returns the ledger row for the month, creating it (with the previous month's closing balance as opening balance) if it does not exist yet.</summary>
        Task<MonthlySummary> GetOrCreateMonthlySummary(int month, int year);
        Task<MonthlySummary> UpdateMonthlySummaryExpense(int id, int newExpense);
        Task<MonthlySummary> UpdateMonthlySummaryFund(int id, int newFund);
        Task<bool> DeleteMonthlySummary(int id);

    }
    public class MonthlySummaryRepository : IMonthlySummaryRepository
    {
        private readonly SMSContext _context;

        public MonthlySummaryRepository(SMSContext context)
        {
            _context = context;
        }

        public async Task<List<MonthlySummary>> GetMonthlySummaries()
        {
            return await _context.MonthlySummaries.ToListAsync();
        }

        public async Task<MonthlySummary> GetMonthlySummaryById(int id)
        {
            return await _context.MonthlySummaries.FirstOrDefaultAsync(ms => ms.Id == id);
        }

        public async Task<MonthlySummary> AddMonthlySummary(MonthlySummary summary)
        {
            _context.MonthlySummaries.Add(summary);
            await _context.SaveChangesAsync();
            return summary;
        }

        public async Task<MonthlySummary> UpdateMonthlySummary(MonthlySummary summary)
        {
            var existing = await GetMonthlySummaryById(summary.Id);
            if (existing != null)
            {
                existing.Month = summary.Month;
                existing.Year = summary.Year;
                existing.OpenningBalance = summary.OpenningBalance;
                existing.TotalFund = summary.TotalFund;
                existing.Expense = summary.Expense;
                existing.ClosingBalance = summary.ClosingBalance;

                await _context.SaveChangesAsync();
                return existing;
            }
            return null;
        }

        public async Task<MonthlySummary> GetMonthlySummaryByMonthYear(int month, int year)
        {
            return await _context.MonthlySummaries
                .FirstOrDefaultAsync(ms => ms.Month == month && ms.Year == year);
        }

        public async Task<MonthlySummary> GetOrCreateMonthlySummary(int month, int year)
        {
            var existing = await GetMonthlySummaryByMonthYear(month, year);
            if (existing != null)
            {
                return existing;
            }

            var prevMonth = month == 1 ? 12 : month - 1;
            var prevYear = month == 1 ? year - 1 : year;
            var previous = await GetMonthlySummaryByMonthYear(prevMonth, prevYear);
            var opening = previous?.ClosingBalance ?? 0;

            var created = new MonthlySummary
            {
                Month = month,
                Year = year,
                OpenningBalance = opening,
                TotalFund = 0,
                Expense = 0,
                ClosingBalance = opening
            };
            _context.MonthlySummaries.Add(created);
            await _context.SaveChangesAsync();
            return created;
        }

        public async Task<bool> DeleteMonthlySummary(int id)
        {
            var summary = await GetMonthlySummaryById(id);
            if (summary != null)
            {
                _context.MonthlySummaries.Remove(summary);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }
        public async Task<MonthlySummary> UpdateMonthlySummaryExpense(int id, int newExpense)
        {
            
            var existing = await GetMonthlySummaryById(id);
            if (existing != null)
            {
                existing.Expense = existing.Expense + newExpense;

               
                existing.ClosingBalance = (existing.OpenningBalance + existing.TotalFund) - existing.Expense;

                await _context.SaveChangesAsync();
                return existing;
            }
            return null;
        }
        public async Task<MonthlySummary> UpdateMonthlySummaryFund(int id, int newFund)
        {

            var existing = await GetMonthlySummaryById(id);
            if (existing != null)
            {
                existing.TotalFund = existing.TotalFund + newFund;
                existing.ClosingBalance = existing.OpenningBalance + existing.TotalFund - existing.Expense;
                await _context.SaveChangesAsync();
                return existing;
            }
            return null;
        }

    }
}

