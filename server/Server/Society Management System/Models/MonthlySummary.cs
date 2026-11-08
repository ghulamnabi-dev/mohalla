namespace Society_Management_System.Models
{
    public class MonthlySummary
    {
        public int Id { get; set; }
        public int Month {  get; set; }
        public int Year {  get; set; }
        public int OpenningBalance {  get; set; }
        public int TotalFund {  get; set; }
        public int Expense { get; set; }
        public int ClosingBalance { get; set; }
    }
}
