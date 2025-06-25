
require('dotenv').config(); // ✅ Load environment variables first
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const dotenv = require('dotenv');
const path = require('path'); // Added for path handling
const categoryRoutes = require('./routes/categories');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin:[ 'http://localhost:4200' ,'https://spilt-wise-fe3.vercel.app']}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Normalized path for consistency
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Gmail SMTP configured for: ${process.env.GMAIL_USER}`);
});
