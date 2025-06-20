const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
  },
  // Optional fields
  profilePicture: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    required: false, // Changed to optional to support existing users
    trim: true,
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
  }, // Store the user's refresh token
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);