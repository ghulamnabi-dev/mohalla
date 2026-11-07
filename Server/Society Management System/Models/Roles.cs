namespace Society_Management_System.Models
{
    /// <summary>Application roles. Admin can change data; Viewer can only read it.</summary>
    public static class Roles
    {
        public const string Admin = "Admin";
        public const string Viewer = "Viewer";
        public static readonly string[] All = { Admin, Viewer };
    }
}
