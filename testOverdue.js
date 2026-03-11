const mongoose = require('mongoose');
const Booking = require('./models/bookingModel');
const Car = require('./models/carModel');

const MONGO_URL = 'mongodb://127.0.0.1:27017/carRental';

async function testOverdueAPI() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('MongoDB connected for testing overdue...');

        const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);

        // Bypass validation by setting endDate via update or saving without validation
        // or we just use mongoose default but wait, if it's required it might fail.
        // With insertMany or runValidators: false

        const testBooking = new Booking({
            customerName: 'Test Overdue',
            carNumber: '30A-123.45',
            startDate: thirtyHoursAgo,
            totalAmount: 1000000
        });

        // Save without validation
        await testBooking.save({ validateBeforeSave: false });
        console.log('Test booking saved (bypassed endDate required).');

        // Now test the query
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const overdueBookings = await Booking.find({
            $or: [
                { endDate: null },
                { endDate: "" },
                { endDate: { $exists: false } }
            ],
            startDate: { $lt: twentyFourHoursAgo }
        }).populate('carDetails');

        console.log('API would return:', JSON.stringify(overdueBookings, null, 2));

        // Cleanup
        await Booking.deleteOne({ _id: testBooking._id });
        console.log('Cleanup done.');

        mongoose.connection.close();
    } catch (err) {
        console.error('Test error:', err);
        mongoose.connection.close();
    }
}

testOverdueAPI();
