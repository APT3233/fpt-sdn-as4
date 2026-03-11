const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');

// Helper function to calculate total amount
function calculateTotalAmount(startDate, endDate, pricePerDay) {
    const timeDifference = endDate - startDate;
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);
    const numberOfDays = Math.ceil(daysDifference); // Round up to full days
    return numberOfDays * pricePerDay;
}

// Get all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get bookings with empty endDate and startDate > 24h ago
exports.getOverdueBookings = async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const bookings = await Booking.find({
            $or: [
                { endDate: null },
                { endDate: "" },
                { endDate: { $exists: false } }
            ],
            startDate: { $lt: twentyFourHoursAgo }
        }).populate('carDetails');

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const { customerName, carNumber, startDate, endDate } = req.body;

        // Validate required fields
        if (!customerName || !carNumber || !startDate || !endDate) {
            return res.status(400).json({ message: 'All fields are required (customerName, carNumber, startDate, endDate)' });
        }

        // Convert dates to Date objects if they are strings
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date order
        if (start >= end) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        // Check if car exists and get pricePerDay
        const car = await Car.findOne({ carNumber: carNumber });
        if (!car) {
            return res.status(404).json({ message: `Car with number ${carNumber} not found` });
        }

        // Calculate total amount automatically
        const totalAmount = calculateTotalAmount(start, end, car.pricePerDay);

        // Check for overlapping bookings with the same carNumber
        // Overlap occurs when: newStart < existingEnd AND newEnd > existingStart
        const overlappingBooking = await Booking.findOne({
            carNumber: carNumber,
            startDate: { $lt: end },    // Existing booking starts before new booking ends
            endDate: { $gt: start }      // Existing booking ends after new booking starts
        });

        if (overlappingBooking) {
            return res.status(409).json({
                message: `Car ${carNumber} is already booked from ${overlappingBooking.startDate.toISOString()} to ${overlappingBooking.endDate.toISOString()}`
            });
        }

        // Create and save the new booking
        const booking = new Booking({
            customerName,
            carNumber,
            startDate: start,
            endDate: end,
            totalAmount
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a booking
exports.updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerName, carNumber, startDate, endDate } = req.body;

        // Check if booking exists
        const existingBooking = await Booking.findById(bookingId);
        if (!existingBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Validate required fields
        if (!customerName || !carNumber || !startDate || !endDate) {
            return res.status(400).json({ message: 'All fields are required (customerName, carNumber, startDate, endDate)' });
        }

        // Convert dates to Date objects if they are strings
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date order
        if (start >= end) {
            return res.status(400).json({ message: 'Start date must be before end date' });
        }

        // Check if car exists and get pricePerDay
        const car = await Car.findOne({ carNumber: carNumber });
        if (!car) {
            return res.status(404).json({ message: `Car with number ${carNumber} not found` });
        }

        // Calculate total amount automatically
        const totalAmount = calculateTotalAmount(start, end, car.pricePerDay);

        // Check for overlapping bookings with the same carNumber
        // Exclude the current booking being updated
        const overlappingBooking = await Booking.findOne({
            _id: { $ne: bookingId },  // Exclude current booking
            carNumber: carNumber,
            startDate: { $lt: end },    // Existing booking starts before new booking ends
            endDate: { $gt: start }      // Existing booking ends after new booking starts
        });

        if (overlappingBooking) {
            return res.status(409).json({
                message: `Car ${carNumber} is already booked from ${overlappingBooking.startDate.toISOString()} to ${overlappingBooking.endDate.toISOString()}`
            });
        }

        // Update the booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                customerName,
                carNumber,
                startDate: start,
                endDate: end,
                totalAmount
            },
            { new: true, runValidators: true }
        );

        res.json(updatedBooking);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }
        res.status(400).json({ message: err.message });
    }
};

// Delete a booking
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findByIdAndDelete(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully', booking });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid booking ID' });
        }
        res.status(500).json({ message: err.message });
    }
};
