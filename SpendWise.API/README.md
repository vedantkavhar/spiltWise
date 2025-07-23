# SpendWise.API

This is the .NET Core API backend for the SpendWise expense tracking application. It provides the same functionality as the Node.js backend but implemented using ASP.NET Core.

## Features

- **User Authentication**: Sign up, sign in, and profile management
- **Expense Management**: Create, read, update, and delete expenses
- **Category Management**: Create, read, update, and delete expense categories
- **Email Notifications**: Send emails for user registration and expense operations
- **JWT Authentication**: Secure API endpoints with JWT tokens
- **MongoDB Integration**: Store data in MongoDB Atlas

## API Endpoints

### Authentication

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/signin`: Login with existing credentials
- `GET /api/auth/me`: Get current user profile
- `POST /api/auth/profile-picture`: Upload user profile picture

### Expenses

- `GET /api/expenses`: Get all expenses (with filtering, sorting, and pagination)
- `GET /api/expenses/summary`: Get expense summary statistics
- `POST /api/expenses`: Add a new expense
- `PUT /api/expenses/{id}`: Update an existing expense
- `DELETE /api/expenses/{id}`: Delete an expense

### Categories

- `GET /api/categories`: Get all categories
- `POST /api/categories`: Create a new category
- `GET /api/categories/{id}`: Get a specific category
- `PUT /api/categories/{id}`: Update a category
- `DELETE /api/categories/{id}`: Delete a category

## Configuration

The API is configured through `appsettings.json` with the following sections:

- **DatabaseSettings**: MongoDB connection string and collection names
- **JWT**: JWT token configuration for authentication
- **Email**: SMTP settings for email notifications
- **Kestrel**: Server configuration

## Running the API

1. Make sure you have .NET 8.0 SDK installed
2. Navigate to the SpendWise.API directory
3. Run `dotnet restore` to restore dependencies
4. Run `dotnet run` to start the API server

The API will be available at http://localhost:5000.

## Compatibility with Node.js Backend

This .NET Core API is designed to be a drop-in replacement for the Node.js backend. It:

1. Uses the same MongoDB database and collection structure
2. Implements identical API endpoints with the same request/response formats
3. Provides the same authentication mechanism using JWT tokens
4. Sends the same email notifications for user actions
5. Supports the same filtering, sorting, and pagination options

The frontend application can work with either backend without any modifications.