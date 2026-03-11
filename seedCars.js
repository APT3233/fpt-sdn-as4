const mongoose = require('mongoose');
const Car = require('./models/carModel');

const MONGO_URL = 'mongodb://127.0.0.1:27017/carRental';

const seedCars = [
    {
        carNumber: '30A-123.45',
        capacity: 4,
        status: 'available',
        pricePerDay: 500000,
        features: ['Air Conditioning', 'Bluetooth', 'GPS']
    },
    {
        carNumber: '30B-678.90',
        capacity: 7,
        status: 'available',
        pricePerDay: 800000,
        features: ['Air Conditioning', 'Leather Seats', 'Sunroof', 'Backup Camera']
    },
    {
        carNumber: '29C-111.22',
        capacity: 5,
        status: 'rented',
        pricePerDay: 600000,
        features: ['Air Conditioning', 'Bluetooth']
    },
    {
        carNumber: '29D-333.44',
        capacity: 4,
        status: 'maintenance',
        pricePerDay: 550000,
        features: ['Air Conditioning', 'Child Seat']
    },
    {
        carNumber: '30E-555.66',
        capacity: 16,
        status: 'available',
        pricePerDay: 1500000,
        features: ['Air Conditioning', 'Microphone', 'TV']
    }
];

async function seedDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('MongoDB connected for seeding...');

        // Optional: clear existing cars
        // await Car.deleteMany({});
        // console.log('Cleared existing cars.');

        await Car.insertMany(seedCars);
        console.log('Seeded car data successfully!');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding data:', err);
        mongoose.connection.close();
    }
}

seedDB();
