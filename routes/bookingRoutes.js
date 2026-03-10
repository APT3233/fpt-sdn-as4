const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', bookingController.getAllBookings);
router.get('/overdue', bookingController.getOverdueBookings);
router.post('/', bookingController.createBooking);
router.put('/:bookingId', bookingController.updateBooking);
router.delete('/:bookingId', bookingController.deleteBooking);

module.exports = router;
