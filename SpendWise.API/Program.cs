using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;
using MongoDB.Driver;
using SpendWise.API.Data;
using SpendWise.API.Middleware;
using SpendWise.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://spilt-wise-fe3.vercel.app"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

// Configure MongoDB
MongoDB.Bson.Serialization.Conventions.ConventionRegistry.Register(
    "IgnoreExtraElements",
    new MongoDB.Bson.Serialization.Conventions.ConventionPack { new MongoDB.Bson.Serialization.Conventions.IgnoreExtraElementsConvention(true) },
    type => true);

var databaseSettings = builder.Configuration.GetSection("DatabaseSettings").Get<DatabaseSettings>() ?? new DatabaseSettings();
var client = new MongoClient(databaseSettings.ConnectionString);
var database = client.GetDatabase(databaseSettings.DatabaseName ?? "expense-tracker");

builder.Services.AddSingleton<IMongoDatabase>(database);

// Configure JWT Authentication
builder.Services.ConfigureJwtAuthentication(builder.Configuration);

// Configure Email Service
builder.Services.AddSingleton<EmailService>();

// Configure file upload
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 5 * 1024 * 1024; // 5MB limit
});

// Add a method to seed initial categories if none exist
builder.Services.AddTransient<CategorySeeder>();

var app = builder.Build();

// Seed initial categories
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var seeder = services.GetRequiredService<CategorySeeder>();
    seeder.SeedCategories().Wait();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

// Ensure wwwroot directory exists
var wwwrootDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Directory.CreateDirectory(wwwrootDir);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootDir),
    RequestPath = ""
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Create uploads directory if it doesn't exist
var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
Directory.CreateDirectory(uploadsDir);

app.Run();