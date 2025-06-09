// const express = require('express');
//   const mongoose = require('mongoose');
//   const cors = require('cors');
//   const dotenv = require('dotenv');

//   dotenv.config();

//   const app = express();

//   app.use(cors({ origin: 'http://localhost:4200' }));
//   app.use(express.json());

//   mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch((err) => console.error('MongoDB connection error:', err));

//   app.use('/api/auth', require('./routes/auth'));
//   app.use('/api/expenses', require('./routes/expenses'));
//   app.use('/api/categories', require('./routes/categories'));

//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));




  const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
const dotenv = require('dotenv');
const path = require('path'); // Added for path handling
// const categoriesRoutes = require('./routes/categories');
const categoryRoutes = require('./routes/categories');  // path may vary


dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Normalized path for consistency

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
// app.use('/api/categories', require('./routes/categories'));
// app.use('/api/categories', categoriesRoutes);
// app.use('/api/expenses/categories', categoriesRoutes);
app.use('/api/categories', categoryRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));