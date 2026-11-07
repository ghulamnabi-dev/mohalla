using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Society_Management_System.Models
{
    public class MonthlyFund
    {
        [Key]
        public int Id {  get; set; }
        [Range(1, 12)]
        public int Month {  get; set; }
        [Range(2000, 2100)]
        public int Year { get; set; }
        [Range(1, 31)]
        public int DatePaid { get; set; }
        [Required, StringLength(100)]
        public string PaidTo {  get; set; }
        [Range(1, int.MaxValue)]
        public int Amount {  get; set; }
        [Range(0, int.MaxValue)]
        public int PaidAmount { get; set; }
        public int Outstanding {  get; set; }
        [Range(1, int.MaxValue)]
        public int ResidentId { get; set; }



    }
}
