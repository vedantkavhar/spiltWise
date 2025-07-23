using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using SpendWise.API.Models;

namespace SpendWise.API.Controllers
{
    [ApiController]
    [Route("api/categories")]
    [Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly IMongoCollection<Category> _categoriesCollection;

        public CategoriesController(IMongoDatabase database)
        {
            _categoriesCollection = database.GetCollection<Category>("categories");
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] Category categoryDto)
        {
            // Validate input
            if (string.IsNullOrEmpty(categoryDto.Name))
            {
                return BadRequest(new { message = "Category name is required" });
            }

            // Check if category already exists
            var existing = await _categoriesCollection.Find(c => c.Name == categoryDto.Name.Trim()).FirstOrDefaultAsync();
            if (existing != null)
            {
                return BadRequest(new { message = "Category already exists" });
            }

            var category = new Category
            {
                Name = categoryDto.Name.Trim()
            };

            await _categoriesCollection.InsertOneAsync(category);
            return StatusCode(201, category);
        }

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoriesCollection.Find(_ => true)
                .Sort(Builders<Category>.Sort.Ascending(c => c.Name))
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategory(string id)
        {
            var category = await _categoriesCollection.Find(c => c.Id == id).FirstOrDefaultAsync();
            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(string id, [FromBody] Category categoryDto)
        {
            if (string.IsNullOrEmpty(categoryDto.Name))
            {
                return BadRequest(new { message = "Category name is required" });
            }

            var category = await _categoriesCollection.Find(c => c.Id == id).FirstOrDefaultAsync();
            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            // Check if new name is unique
            var existing = await _categoriesCollection.Find(c => c.Name == categoryDto.Name.Trim() && c.Id != id).FirstOrDefaultAsync();
            if (existing != null)
            {
                return BadRequest(new { message = "Category name already exists" });
            }

            var update = Builders<Category>.Update.Set(c => c.Name, categoryDto.Name.Trim());
            await _categoriesCollection.UpdateOneAsync(c => c.Id == id, update);

            var updatedCategory = await _categoriesCollection.Find(c => c.Id == id).FirstOrDefaultAsync();
            return Ok(updatedCategory);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(string id)
        {
            var category = await _categoriesCollection.FindOneAndDeleteAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound(new { message = "Category not found" });
            }

            return Ok(new { message = "Category deleted" });
        }
    }
}