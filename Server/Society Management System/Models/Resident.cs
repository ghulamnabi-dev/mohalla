using System.ComponentModel.DataAnnotations;

namespace Society_Management_System.Models
{
    public class Resident
    {
        [Key]
        public int Id { get; set; }
        [Required, StringLength(100, MinimumLength = 2)]
        public string OwnerName { get; set; }
        [Required, StringLength(20)]
        public string HouseNumber {  get; set; }
        [Required, RegularExpression(@"^[0-9+\-() ]{7,20}$", ErrorMessage = "Enter a valid phone number.")]
        public string PhoneNumber {  get; set; }
        [Required, StringLength(100)]
        public string Street {  get; set; }

       
    }
}
