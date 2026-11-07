using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Society_Management_System.Models
{
    public class MonthlyExpense
    {
        [Key]
        public int Id {  get; set; }
        [Range(1, int.MaxValue)]
        public int Amount { get; set; }
        [Range(1, 12)]
        public int Month {  get; set; }
        [Range(2000, 2100)]
        public int Year {  get; set; }
        [Required, StringLength(200, MinimumLength = 2)]
        public string Description {  get; set; }
        [Range(1, 31)]
        public int ExpenseDate {  get; set; }
        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        
       

    }
}
