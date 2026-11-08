using System.ComponentModel.DataAnnotations;

namespace Society_Management_System.DTO
{
    /// <summary>Common query-string parameters for paged list endpoints.</summary>
    public class PagedQuery
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 200)]
        public int PageSize { get; set; } = 25;

        [Range(1, 12)]
        public int? Month { get; set; }

        [Range(2000, 2100)]
        public int? Year { get; set; }

        /// <summary>Free-text filter (resident name / house, or expense description).</summary>
        [MaxLength(100)]
        public string? Q { get; set; }

        /// <summary>Field to sort by; each endpoint documents the accepted values.</summary>
        public string? Sort { get; set; }

        /// <summary>"asc" or "desc" (default).</summary>
        public string Dir { get; set; } = "desc";

        public bool Descending => !string.Equals(Dir, "asc", StringComparison.OrdinalIgnoreCase);
        public int Skip => (Page - 1) * PageSize;
    }

    public class FundQuery : PagedQuery
    {
        public int? ResidentId { get; set; }
    }

    public class ExpenseQuery : PagedQuery
    {
        public int? CategoryId { get; set; }
    }

    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize);
    }

    /// <summary>A contribution row joined with the resident it belongs to.</summary>
    public class FundRowDto
    {
        public int Id { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int DatePaid { get; set; }
        public string PaidTo { get; set; } = string.Empty;
        public int Amount { get; set; }
        public int PaidAmount { get; set; }
        public int Outstanding { get; set; }
        public int ResidentId { get; set; }
        public string ResidentName { get; set; } = string.Empty;
        public string HouseNumber { get; set; } = string.Empty;
    }

    /// <summary>An expense row joined with its category name.</summary>
    public class ExpenseRowDto
    {
        public int Id { get; set; }
        public int Amount { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string Description { get; set; } = string.Empty;
        public int ExpenseDate { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    /// <summary>A resident's full payment history with totals.</summary>
    public class ResidentStatementDto
    {
        public Models.Resident Resident { get; set; } = new();
        public List<Models.MonthlyFund> Payments { get; set; } = new();
        public int TotalDue { get; set; }
        public int TotalPaid { get; set; }
        public int Balance => TotalDue - TotalPaid;
        public int MonthsPaid { get; set; }
        public int MonthsShort { get; set; }
    }
}
