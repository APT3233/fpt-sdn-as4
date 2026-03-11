const Car = require('../models/carModel');

// Get all cars
exports.getAllCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.json(cars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single car by ID
exports.getCarById = async (req, res) => {
    try {
        const { carId } = req.params;
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid car ID' });
        }
        res.status(500).json({ message: err.message });
    }
};

// Get a car by carNumber
exports.getCarByNumber = async (req, res) => {
    try {
        const { carNumber } = req.params;
        const car = await Car.findOne({ carNumber: carNumber });
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new car
exports.createCar = async (req, res) => {
    try {
        const { carNumber, capacity, status, pricePerDay, features } = req.body;

        // Validate required fields
        if (!carNumber || !capacity || !pricePerDay) {
            return res.status(400).json({ message: 'carNumber, capacity, and pricePerDay are required' });
        }

        const car = new Car({
            carNumber,
            capacity,
            status: status || 'available',
            pricePerDay,
            features: features || []
        });

        await car.save();
        res.status(201).json(car);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Car number already exists' });
        }
        res.status(400).json({ message: err.message });
    }
};

// Update a car
exports.updateCar = async (req, res) => {
    try {
        const { carId } = req.params;
        const { carNumber, capacity, status, pricePerDay, features } = req.body;

        const updatedCar = await Car.findByIdAndUpdate(
            carId,
            { carNumber, capacity, status, pricePerDay, features },
            { new: true, runValidators: true }
        );

        if (!updatedCar) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json(updatedCar);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid car ID' });
        }
        res.status(400).json({ message: err.message });
    }
};

// Delete a car
exports.deleteCar = async (req, res) => {
    try {
        const { carId } = req.params;

        const car = await Car.findByIdAndDelete(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        res.json({ message: 'Car deleted successfully', car });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid car ID' });
        }
        res.status(500).json({ message: err.message });
    }
};
