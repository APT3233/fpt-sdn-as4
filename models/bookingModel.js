const mongoose = require('mongoose');

// Define the Booking Schema
const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  carNumber: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false,
    validate: {
      validator: function (value) {
        if (!value) return true;
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for population
bookingSchema.virtual('carDetails', {
  ref: 'Car',
  localField: 'carNumber',
  foreignField: 'carNumber',
  justOne: true
});

// Create and export the Booking model
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
