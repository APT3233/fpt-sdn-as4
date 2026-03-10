const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');

// Helper: calculate rental days and total amount
function getRentalDaysAndAmount(startDate, endDate, pricePerDay) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return { days, totalAmount: days * pricePerDay };
}

// GET all bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET overdue bookings: endDate rỗng (chưa kết thúc) VÀ startDate đã quá 24h
// Query: ?asOf=2025-02-10 (ISO string) - dùng để test, mặc định = now
exports.getOverdueBookings = async (req, res) => {
    try {
        const now = req.query.asOf ? new Date(req.query.asOf) : new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const results = await Booking.aggregate([
            {
                $match: {
                    $or: [
                        { endDate: null },
                        { endDate: { $exists: false } },
                        { endDate: '' },
                        { endDate: 'null' }
                    ],
                    startDate: { $lte: twentyFourHoursAgo }
                }
            },
            {
                $lookup: {
                    from: 'cars',
                    localField: 'carNumber',
                    foreignField: 'carNumber',
                    as: 'car'
                }
            },
            { $unwind: { path: '$car', preserveNullAndEmptyArrays: true } }
        ]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// CREATE booking
exports.createBooking = async (req, res) => {
    try {
        const { customerName, carNumber, startDate, endDate } = req.body;

        if (!customerName || !carNumber || !startDate || !endDate) {
            return res.status(400).json({ message: 'customerName, carNumber, startDate and endDate are required' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({ message: 'startDate must be before endDate' });
        }

        // Check date overlap for same car
        const conflict = await Booking.findOne({
            carNumber,
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } }
            ]
        });

        if (conflict) {
            return res.status(400).json({ message: 'Booking date conflict for this car' });
        }

        const car = await Car.findOne({ carNumber });
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const { totalAmount } = getRentalDaysAndAmount(startDate, endDate, car.pricePerDay);

        const booking = new Booking({
            customerName,
            carNumber,
            startDate,
            endDate,
            totalAmount
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE booking
exports.updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const existing = await Booking.findById(bookingId);
        if (!existing) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const updates = { ...req.body };
        const carNumber = updates.carNumber !== undefined ? updates.carNumber : existing.carNumber;
        const startDate = updates.startDate !== undefined ? updates.startDate : existing.startDate;
        const endDate = updates.endDate !== undefined ? updates.endDate : existing.endDate;

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({ message: 'startDate must be before endDate' });
        }

        // Check overlap excluding current booking
        const conflict = await Booking.findOne({
            carNumber,
            _id: { $ne: bookingId },
            $or: [
                { startDate: { $lt: end }, endDate: { $gt: start } }
            ]
        });
        if (conflict) {
            return res.status(400).json({ message: 'Booking date conflict for this car' });
        }

        const car = await Car.findOne({ carNumber });
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const { totalAmount } = getRentalDaysAndAmount(startDate, endDate, car.pricePerDay);
        updates.totalAmount = totalAmount;

        const updated = await Booking.findByIdAndUpdate(
            bookingId,
            updates,
            { new: true, runValidators: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE booking
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findByIdAndDelete(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json({ message: 'Booking deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
