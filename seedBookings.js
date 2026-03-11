const mongoose = require('mongoose');
const Booking = require('./models/bookingModel');
const Car = require('./models/carModel');

const MONGO_URL = 'mongodb://127.0.0.1:27017/carRental';

async function seedBookings() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('MongoDB connected for seeding bookings...');

        await Booking.deleteMany({});
        console.log('Cleared existing bookings.');

        const now = new Date();
        const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000); // > 24h
        const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);   // < 24h
        const futureDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);    // Future

        const seedData = [
            {
                customerName: 'Nguyen Van A',
                carNumber: '30A-123.45', // Must match an existing car from seedCars
                startDate: thirtyHoursAgo,
                endDate: null, // Overdue booking (startDate > 24h ago, no endDate)
                totalAmount: 0 // Amount not finalized
            },
            {
                customerName: 'Tran Thi B',
                carNumber: '30B-678.90',
                startDate: tenHoursAgo,
                endDate: null, // Open booking, but not overdue (startDate < 24h ago)
                totalAmount: 0
            },
            {
                customerName: 'Le Van C',
                carNumber: '29C-111.22',
                startDate: tenHoursAgo,
                endDate: futureDate, // Normal active booking
                totalAmount: 1200000
            },
            {
                customerName: 'Pham Thi D',
                carNumber: '29D-333.44',
                startDate: thirtyHoursAgo, // > 24h ago
                endDate: undefined, // Also overdue
                totalAmount: 0
            }
        ];

        // Inserting without validation for testing if needed, but our updated schema should allow it
        for (const data of seedData) {
            const booking = new Booking(data);
            await booking.save();
        }

        console.log('Seeded booking data successfully!');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding data:', err);
        mongoose.connection.close();
    }
}

seedBookings();
