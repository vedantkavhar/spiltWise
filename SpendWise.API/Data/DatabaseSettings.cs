namespace SpendWise.API.Data
{
    public class DatabaseSettings
    {
        public string ConnectionString { get; set; } = string.Empty;
        public string DatabaseName { get; set; } = string.Empty;
        public string UsersCollection { get; set; } = string.Empty;
        public string ExpensesCollection { get; set; } = string.Empty;
        public string CategoriesCollection { get; set; } = string.Empty;
    }
}