const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', carController.getAllCars);
router.get('/:carId', carController.getCarById);
router.post('/', carController.createCar);
router.put('/:carId', carController.updateCar);
router.delete('/:carId', carController.deleteCar);

module.exports = router;
