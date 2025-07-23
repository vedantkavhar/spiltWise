using MongoDB.Driver;
using SpendWise.API.Models;

namespace SpendWise.API.Services
{
    public class CategorySeeder
    {
        private readonly IMongoCollection<Category> _categoriesCollection;

        public CategorySeeder(IMongoDatabase database)
        {
            _categoriesCollection = database.GetCollection<Category>("categories");
        }

        public async Task SeedCategories()
        {
            // Check if categories already exist
            var existingCategories = await _categoriesCollection.CountDocumentsAsync(_ => true);
            if (existingCategories > 0)
            {
                Console.WriteLine($"Categories already exist: {existingCategories} found");
                return;
            }

            // Add default categories
            var defaultCategories = new List<Category>
            {
                new Category { Name = "Food" },
                new Category { Name = "Transportation" },
                new Category { Name = "Entertainment" },
                new Category { Name = "Shopping" },
                new Category { Name = "Utilities" },
                new Category { Name = "Health" },
                new Category { Name = "Education" },
                new Category { Name = "Travel" },
                new Category { Name = "Housing" },
                new Category { Name = "Other" }
            };

            await _categoriesCollection.InsertManyAsync(defaultCategories);
            Console.WriteLine($"Added {defaultCategories.Count} default categories");
        }
    }
}