using Microsoft.EntityFrameworkCore;
using Society_Management_System.DTO;
using Society_Management_System.Models;

namespace Society_Management_System.Services
{
    /// <summary>Read-only, query-shaped endpoints: paged lists and statements. Kept apart from the CRUD services.</summary>
    public interface IReportingService
    {
        Task<PagedResult<FundRowDto>> SearchFunds(FundQuery query);
        Task<PagedResult<ExpenseRowDto>> SearchExpenses(ExpenseQuery query);
        Task<ResidentStatementDto?> GetResidentStatement(int residentId);
    }

    public class ReportingService : IReportingService
    {
        private readonly SMSContext _db;

        public ReportingService(SMSContext db)
        {
            _db = db;
        }

        public async Task<PagedResult<FundRowDto>> SearchFunds(FundQuery q)
        {
            var rows =
                from f in _db.MonthlyFunds.AsNoTracking()
                join r in _db.Resident.AsNoTracking() on f.ResidentId equals r.Id into rj
                from r in rj.DefaultIfEmpty()
                select new FundRowDto
                {
                    Id = f.Id, Month = f.Month, Year = f.Year, DatePaid = f.DatePaid, PaidTo = f.PaidTo,
                    Amount = f.Amount, PaidAmount = f.PaidAmount, Outstanding = f.Outstanding, ResidentId = f.ResidentId,
                    ResidentName = r != null ? r.OwnerName : "Unknown",
                    HouseNumber = r != null ? r.HouseNumber : "",
                };

            if (q.Year is int year) rows = rows.Where(x => x.Year == year);
            if (q.Month is int month) rows = rows.Where(x => x.Month == month);
            if (q.ResidentId is int rid) rows = rows.Where(x => x.ResidentId == rid);
            if (!string.IsNullOrWhiteSpace(q.Q))
            {
                var term = q.Q.Trim();
                rows = rows.Where(x => x.ResidentName.Contains(term) || x.HouseNumber.Contains(term) || x.PaidTo.Contains(term));
            }

            rows = (q.Sort?.ToLowerInvariant()) switch
            {
                "resident" => q.Descending ? rows.OrderByDescending(x => x.ResidentName) : rows.OrderBy(x => x.ResidentName),
                "amount" => q.Descending ? rows.OrderByDescending(x => x.Amount) : rows.OrderBy(x => x.Amount),
                "paid" => q.Descending ? rows.OrderByDescending(x => x.PaidAmount) : rows.OrderBy(x => x.PaidAmount),
                "short" => q.Descending ? rows.OrderByDescending(x => x.Amount - x.PaidAmount) : rows.OrderBy(x => x.Amount - x.PaidAmount),
                _ => q.Descending
                    ? rows.OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ThenByDescending(x => x.DatePaid).ThenByDescending(x => x.Id)
                    : rows.OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.DatePaid).ThenBy(x => x.Id),
            };

            return await Page(rows, q);
        }

        public async Task<PagedResult<ExpenseRowDto>> SearchExpenses(ExpenseQuery q)
        {
            var rows =
                from e in _db.MonthlyExpenses.AsNoTracking()
                join c in _db.ExpenseCategories.AsNoTracking() on e.CategoryId equals c.Id into cj
                from c in cj.DefaultIfEmpty()
                select new ExpenseRowDto
                {
                    Id = e.Id, Amount = e.Amount, Month = e.Month, Year = e.Year, Description = e.Description,
                    ExpenseDate = e.ExpenseDate, CategoryId = e.CategoryId,
                    CategoryName = c != null ? c.Name : "Uncategorised",
                };

            if (q.Year is int year) rows = rows.Where(x => x.Year == year);
            if (q.Month is int month) rows = rows.Where(x => x.Month == month);
            if (q.CategoryId is int cid) rows = rows.Where(x => x.CategoryId == cid);
            if (!string.IsNullOrWhiteSpace(q.Q))
            {
                var term = q.Q.Trim();
                rows = rows.Where(x => x.Description.Contains(term) || x.CategoryName.Contains(term));
            }

            rows = (q.Sort?.ToLowerInvariant()) switch
            {
                "description" => q.Descending ? rows.OrderByDescending(x => x.Description) : rows.OrderBy(x => x.Description),
                "category" => q.Descending ? rows.OrderByDescending(x => x.CategoryName) : rows.OrderBy(x => x.CategoryName),
                "amount" => q.Descending ? rows.OrderByDescending(x => x.Amount) : rows.OrderBy(x => x.Amount),
                _ => q.Descending
                    ? rows.OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ThenByDescending(x => x.ExpenseDate).ThenByDescending(x => x.Id)
                    : rows.OrderBy(x => x.Year).ThenBy(x => x.Month).ThenBy(x => x.ExpenseDate).ThenBy(x => x.Id),
            };

            return await Page(rows, q);
        }

        public async Task<ResidentStatementDto?> GetResidentStatement(int residentId)
        {
            var resident = await _db.Resident.AsNoTracking().FirstOrDefaultAsync(r => r.Id == residentId);
            if (resident == null) return null;

            var payments = await _db.MonthlyFunds.AsNoTracking()
                .Where(f => f.ResidentId == residentId)
                .OrderByDescending(f => f.Year).ThenByDescending(f => f.Month).ThenByDescending(f => f.DatePaid)
                .ToListAsync();

            return new ResidentStatementDto
            {
                Resident = resident,
                Payments = payments,
                TotalDue = payments.Sum(p => p.Amount),
                TotalPaid = payments.Sum(p => p.PaidAmount),
                MonthsPaid = payments.Count(p => p.PaidAmount >= p.Amount),
                MonthsShort = payments.Count(p => p.PaidAmount < p.Amount),
            };
        }

        private static async Task<PagedResult<T>> Page<T>(IQueryable<T> rows, PagedQuery q)
        {
            var total = await rows.CountAsync();
            var items = await rows.Skip(q.Skip).Take(q.PageSize).ToListAsync();
            return new PagedResult<T> { Items = items, Total = total, Page = q.Page, PageSize = q.PageSize };
        }
    }
}
