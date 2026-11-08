using System.ComponentModel.DataAnnotations;
using System.Collections.ObjectModel;

namespace Society_Management_System.Models
{
    public class ExpenseCategory
    {
        public int Id { get; set; }
        [Required, StringLength(60, MinimumLength = 2)]
        public string Name { get; set; }

        
       
    }
}
