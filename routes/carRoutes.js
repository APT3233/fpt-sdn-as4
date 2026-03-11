const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Routes for cars
router.route('/')
    .get(carController.getAllCars)
    .post(carController.createCar);

// Routes for individual car by ID
router.route('/:carId')
    .get(carController.getCarById)
    .put(carController.updateCar)
    .delete(carController.deleteCar);

// Route for car by carNumber
router.route('/number/:carNumber')
    .get(carController.getCarByNumber);

module.exports = router;
