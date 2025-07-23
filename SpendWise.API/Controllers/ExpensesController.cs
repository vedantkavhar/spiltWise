using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using SpendWise.API.Models;
using SpendWise.API.Services;
using System.Security.Claims;

namespace SpendWise.API.Controllers
{
    [ApiController]
    [Route("api/expenses")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly IMongoCollection<Expense> _expensesCollection;
        private readonly IMongoCollection<Category> _categoriesCollection;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly EmailService _emailService;

        public ExpensesController(IMongoDatabase database, EmailService emailService)
        {
            _expensesCollection = database.GetCollection<Expense>("expenses");
            _categoriesCollection = database.GetCollection<Category>("categories");
            _usersCollection = database.GetCollection<User>("users");
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetExpenses([FromQuery] string? category, [FromQuery] string? type,
            [FromQuery] string? period, [FromQuery] string? search, [FromQuery] string? sort,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 5)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            Console.WriteLine($"GetExpenses called for user {userId}");
            Console.WriteLine($"Query params: category={category}, type={type}, period={period}, search={search}, sort={sort}, page={page}, pageSize={pageSize}");

            var filterBuilder = Builders<Expense>.Filter;
            var filter = filterBuilder.Eq(e => e.UserId, userId);

            // Category filter
            if (!string.IsNullOrEmpty(category) && category != "All")
            {
                filter &= filterBuilder.Eq(e => e.Category, category);
            }

            // Type filter
            if (!string.IsNullOrEmpty(type))
            {
                filter &= filterBuilder.Eq(e => e.Type, type);
            }

            // Period filter
            if (!string.IsNullOrEmpty(period) && period != "All")
            {
                var days = period == "Weekly" ? 7 : 30;
                var startDate = DateTime.UtcNow.AddDays(-days);
                filter &= filterBuilder.Gte(e => e.Date, startDate);
            }

            // Search filter
            if (!string.IsNullOrEmpty(search))
            {
                var searchFilter = filterBuilder.Regex(e => e.Description, new BsonRegularExpression(search, "i")) |
                                  filterBuilder.Regex(e => e.Category, new BsonRegularExpression(search, "i"));

                // Try to parse search as number for amount search
                if (decimal.TryParse(search, out decimal amount))
                {
                    searchFilter |= filterBuilder.Eq(e => e.Amount, amount);
                }

                filter &= searchFilter;
            }

            // Sorting
            var sortDefinition = Builders<Expense>.Sort.Descending(e => e.Date);
            if (!string.IsNullOrEmpty(sort))
            {
                switch (sort)
                {
                    case "date-asc":
                        sortDefinition = Builders<Expense>.Sort.Ascending(e => e.Date);
                        break;
                    case "price-desc":
                        sortDefinition = Builders<Expense>.Sort.Descending(e => e.Amount);
                        break;
                    case "price-asc":
                        sortDefinition = Builders<Expense>.Sort.Ascending(e => e.Amount);
                        break;
                }
            }

            // Pagination
            var skip = (page - 1) * pageSize;
            var expenses = await _expensesCollection.Find(filter)
                .Sort(sortDefinition)
                .Skip(skip)
                .Limit(pageSize)
                .ToListAsync();

            // Total count for pagination
            var total = await _expensesCollection.CountDocumentsAsync(filter);

            // Map expenses to include _id for frontend compatibility
            var mappedExpenses = expenses.Select(e => new {
                _id = e.Id,  // Add _id field for frontend compatibility
                id = e.Id,   // Keep id field for .NET compatibility
                description = e.Description,
                amount = e.Amount,
                date = e.Date,
                userId = e.UserId,
                category = e.Category,
                type = e.Type
            }).ToList();
            
            return Ok(new { expenses = mappedExpenses, total });
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                Console.WriteLine("GetSummary: User not authenticated");
                return Unauthorized(new { message = "Not authenticated" });
            }

            Console.WriteLine($"GetSummary: Processing for user {userId}");
            
            // Debug: Count all expenses in the collection
            var allExpensesCount = await _expensesCollection.CountDocumentsAsync(_ => true);
            Console.WriteLine($"GetSummary: Total expenses in collection: {allExpensesCount}");
            
            // Debug: Count expenses for this user
            var userExpensesCount = await _expensesCollection.CountDocumentsAsync(e => e.UserId == userId);
            Console.WriteLine($"GetSummary: User has {userExpensesCount} expenses");
            
            // Check if user has any expenses
            var hasExpenses = userExpensesCount > 0;
            
            if (!hasExpenses)
            {
                Console.WriteLine($"GetSummary: No expenses found for user {userId}, returning empty summary");
                
                // Return empty summary
                return Ok(new
                {
                    total = 0,
                    count = 0,
                    byCategory = new List<object>()
                });
            }

            // Debug: Get a sample of expenses for this user
            var sampleExpenses = await _expensesCollection.Find(e => e.UserId == userId)
                .Limit(3)
                .ToListAsync();
            Console.WriteLine($"GetSummary: Sample expenses for user {userId}:");
            foreach (var exp in sampleExpenses)
            {
                Console.WriteLine($"  - ID: {exp.Id}, Amount: {exp.Amount}, Type: {exp.Type}, Category: {exp.Category}");
            }
            
            // Total and count - include only Expense type
            var totalPipeline = new BsonDocument[]
            {
                new BsonDocument("$match", new BsonDocument
                {
                    { "userId", userId }
                    // Temporarily remove type filter to see all expenses
                }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", BsonNull.Value },
                    { "total", new BsonDocument("$sum", "$amount") },
                    { "count", new BsonDocument("$sum", 1) }
                })
            };

            var totalResults = await _expensesCollection.Aggregate<BsonDocument>(totalPipeline).ToListAsync();
            Console.WriteLine($"GetSummary: Total results count: {totalResults.Count}");
            
            var total = totalResults.Any() ? totalResults[0]["total"].AsDecimal : 0;
            var count = totalResults.Any() ? totalResults[0]["count"].AsInt32 : 0;

            Console.WriteLine($"GetSummary: Found {count} expenses totaling {total} for user {userId}");

            // By category
            var categoryPipeline = new BsonDocument[]
            {
                new BsonDocument("$match", new BsonDocument
                {
                    { "userId", userId }
                    // Temporarily remove type filter to see all expenses
                }),
                new BsonDocument("$group", new BsonDocument
                {
                    { "_id", "$category" },
                    { "total", new BsonDocument("$sum", "$amount") },
                    { "count", new BsonDocument("$sum", 1) }
                }),
                new BsonDocument("$sort", new BsonDocument("_id", 1))
            };

            var categoryResults = await _expensesCollection.Aggregate<BsonDocument>(categoryPipeline).ToListAsync();
            Console.WriteLine($"GetSummary: Category results count: {categoryResults.Count}");
            
            var byCategory = categoryResults.Select(c => new
            {
                category = c["_id"].IsBsonNull ? "Uncategorized" : c["_id"].AsString,
                total = c["total"].AsDecimal,
                count = c["count"].AsInt32,
                type = "Expense" // Add type field to match frontend interface
            }).ToList();

            Console.WriteLine($"GetSummary: Found {byCategory.Count} expense categories for user {userId}");
            foreach (var cat in byCategory)
            {
                Console.WriteLine($"  - Category: {cat.category}, Total: {cat.total}, Count: {cat.count}");
            }
            
            // Calculate total and count from byCategory if we have categories but no total/count
            if (byCategory.Any() && (total == 0 || count == 0))
            {
                total = byCategory.Sum(c => c.total);
                count = byCategory.Sum(c => c.count);
                Console.WriteLine($"GetSummary: Recalculated total={total}, count={count} from byCategory");
            }

            return Ok(new
            {
                total,
                count,
                byCategory
            });
        }

        [HttpPost]
        public async Task<IActionResult> AddExpense([FromBody] Expense expenseDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Validate required fields
            if (string.IsNullOrEmpty(expenseDto.Description) || expenseDto.Amount <= 0 || string.IsNullOrEmpty(expenseDto.Category))
            {
                return BadRequest(new { message = "All fields (description, amount, date, category) are required" });
            }

            // Validate category exists
            var validCategory = await _categoriesCollection.Find(c => c.Name == expenseDto.Category).FirstOrDefaultAsync();
            if (validCategory == null)
            {
                return BadRequest(new { message = "Invalid category" });
            }

            // Create expense
            var expense = new Expense
            {
                Description = expenseDto.Description.Trim(),
                Amount = expenseDto.Amount,
                Date = expenseDto.Date != default ? expenseDto.Date : DateTime.UtcNow,
                Category = expenseDto.Category.Trim(),
                UserId = userId,
                Type = expenseDto.Type ?? "Expense"
            };

            await _expensesCollection.InsertOneAsync(expense);

            // Fetch user details
            var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();

            // Send email notification if enabled
            var emailResult = new { success = false, message = "Email notification skipped or disabled" };
            if (user != null && user.EmailNotifications)
            {
                try
                {
                    await _emailService.SendExpenseNotification(
                        user.Email,
                        user.Username,
                        new ExpenseNotificationData
                        {
                            Category = expense.Category,
                            Amount = expense.Amount,
                            Date = expense.Date,
                            Description = expense.Description
                        });
                    emailResult = new { success = true, message = "Email notification sent" };
                }
                catch (Exception ex)
                {
                    emailResult = new { success = false, message = $"Failed to send email: {ex.Message}" };
                }
            }

            return StatusCode(201, new
            {
                message = "Expense added successfully",
                expense = new
                {
                    id = expense.Id,
                    category = expense.Category,
                    amount = expense.Amount,
                    date = expense.Date,
                    description = expense.Description
                },
                notification = emailResult
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExpense(string id, [FromBody] Expense expenseDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            var expense = await _expensesCollection.Find(e => e.Id == id && e.UserId == userId).FirstOrDefaultAsync();
            if (expense == null)
            {
                return NotFound(new { message = "Expense not found" });
            }

            if (expenseDto.Type == "Expense" && !string.IsNullOrEmpty(expenseDto.Category))
            {
                var validCategory = await _categoriesCollection.Find(c => c.Name == expenseDto.Category).FirstOrDefaultAsync();
                if (validCategory == null)
                {
                    return BadRequest(new { message = "Invalid category" });
                }
            }

            var update = Builders<Expense>.Update;
            var updateDefinition = update.Set(e => e.UpdatedAt, DateTime.UtcNow);

            if (!string.IsNullOrEmpty(expenseDto.Description))
                updateDefinition = updateDefinition.Set(e => e.Description, expenseDto.Description);

            if (expenseDto.Amount > 0)
                updateDefinition = updateDefinition.Set(e => e.Amount, expenseDto.Amount);

            if (expenseDto.Date != default)
                updateDefinition = updateDefinition.Set(e => e.Date, expenseDto.Date);

            updateDefinition = updateDefinition.Set(e => e.Category, expenseDto.Type == "Income" ? null : expenseDto.Category);

            if (!string.IsNullOrEmpty(expenseDto.Type))
                updateDefinition = updateDefinition.Set(e => e.Type, expenseDto.Type);

            await _expensesCollection.UpdateOneAsync(e => e.Id == id, updateDefinition);

            // Get updated expense
            var updatedExpense = await _expensesCollection.Find(e => e.Id == id).FirstOrDefaultAsync();

            // Fetch user details
            var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();

            // Send email notification if enabled
            var emailResult = new { success = false, message = "Email notification skipped or disabled" };
            if (user != null && user.EmailNotifications)
            {
                try
                {
                    await _emailService.SendUpdatedExpenseNotification(
                        user.Email,
                        user.Username,
                        new ExpenseNotificationData
                        {
                            Category = updatedExpense.Category,
                            Amount = updatedExpense.Amount,
                            Date = updatedExpense.Date,
                            Description = updatedExpense.Description,
                            Type = updatedExpense.Type
                        });
                    emailResult = new { success = true, message = "Email notification sent" };
                }
                catch (Exception ex)
                {
                    emailResult = new { success = false, message = $"Failed to send email: {ex.Message}" };
                }
            }

            return Ok(new
            {
                message = "Expense updated successfully",
                expense = updatedExpense,
                notification = emailResult
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(string id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            var result = await _expensesCollection.DeleteOneAsync(e => e.Id == id && e.UserId == userId);
            if (result.DeletedCount == 0)
            {
                return NotFound(new { message = "Expense not found" });
            }

            return Ok(new { message = "Expense deleted" });
        }

        [HttpPost("add-real-expense")]
        public async Task<IActionResult> AddRealExpense()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Ensure we have some categories
            var categories = await _categoriesCollection.Find(_ => true).ToListAsync();
            if (!categories.Any())
            {
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
                categories = defaultCategories;
            }

            // Create a real expense
            var expense = new Expense
            {
                Description = "Groceries",
                Amount = 1500,
                Date = DateTime.UtcNow,
                Category = "Food",
                UserId = userId,
                Type = "Expense"
            };

            await _expensesCollection.InsertOneAsync(expense);

            // Create another expense
            var expense2 = new Expense
            {
                Description = "Monthly Salary",
                Amount = 50000,
                Date = DateTime.UtcNow,
                Category = "Income",
                UserId = userId,
                Type = "Income"
            };

            await _expensesCollection.InsertOneAsync(expense2);

            return Ok(new { message = "Added real expenses", expenses = new[] { expense, expense2 } });
        }

        [HttpGet("debug")]
        public async Task<IActionResult> DebugExpenses()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Not authenticated" });
            }

            // Get database stats
            var dbStats = new Dictionary<string, object>();

            // Check if user exists
            var user = await _usersCollection.Find(u => u.Id == userId).FirstOrDefaultAsync();
            dbStats["userExists"] = user != null;
            dbStats["userId"] = userId;
            
            if (user != null)
            {
                dbStats["username"] = user.Username;
                dbStats["email"] = user.Email;
            }

            // Count expenses for this user
            var expenseCount = await _expensesCollection.CountDocumentsAsync(e => e.UserId == userId);
            dbStats["expenseCount"] = expenseCount;

            // Count total expenses in the collection
            var totalExpenseCount = await _expensesCollection.CountDocumentsAsync(_ => true);
            dbStats["totalExpenseCount"] = totalExpenseCount;

            // Count categories
            var categoryCount = await _categoriesCollection.CountDocumentsAsync(_ => true);
            dbStats["categoryCount"] = categoryCount;

            // Get a sample of expenses for this user (up to 5)
            var sampleExpenses = await _expensesCollection.Find(e => e.UserId == userId)
                .Limit(5)
                .ToListAsync();
            dbStats["sampleExpenses"] = sampleExpenses;

            // Get all users in the database
            var allUsers = await _usersCollection.Find(_ => true).ToListAsync();
            dbStats["allUsers"] = allUsers.Select(u => new { u.Id, u.Username, u.Email }).ToList();

            // Get MongoDB connection status
            dbStats["mongoDbConnected"] = true; // If we got this far, we're connected

            return Ok(dbStats);
        }
    }
}