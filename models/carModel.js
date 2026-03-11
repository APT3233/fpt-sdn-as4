const mongoose = require('mongoose');

// Define the Car Schema
const carSchema = new mongoose.Schema({
  carNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  features: {
    type: [String],
    default: []
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Car model
const Car = mongoose.model('Car', carSchema);

module.exports = Car;
