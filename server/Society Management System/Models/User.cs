using Microsoft.AspNetCore.Identity;

namespace Society_Management_System.Models
{
    public class User:IdentityUser
    {
        public string FullName { get; set; }
    }
}
