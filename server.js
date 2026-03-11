// server.js
require('dotenv').config(); // Load .env FIRST

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────
// CORS Configuration
// ─────────────────────────────────────────────────────────
// Build allowed origins list — Railway injects RAILWAY_PUBLIC_DOMAIN automatically
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://namnguyxn.up.railway.app', // New domain
    ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
    ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : [])
];

app.use(cors({
    origin: (origin, callback) => {
        // 1. Allow requests with no origin (e.g. server-side, Postman)
        if (!origin) return callback(null, true);

        // 2. Check if origin is in the explicit whitelist
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // 3. Resilient check: Allow any Railway subdomain in production
        if (origin.endsWith('.up.railway.app')) return callback(null, true);

        // Otherwise, block
        console.warn(`⚠️ CORS blocked: origin "${origin}" not in allowed list.`);
        callback(new Error(`CORS blocked: origin "${origin}" not allowed.`));
    },
    credentials: true,              // Allow cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests via middleware (Express 5 compatible)
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        return res.sendStatus(204);
    }
    next();
});

// ─────────────────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse httpOnly cookies (JWT)

// ─────────────────────────────────────────────────────────
// View Engine — EJS
// ─────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────
// Import models & middleware
// ─────────────────────────────────────────────────────────
const Car = require('./models/carModel');
const Booking = require('./models/bookingModel');
const { optionalAuth, protect } = require('./middleware/authMiddleware');

// ─────────────────────────────────────────────────────────
// VIEW ROUTES (Server-Side EJS — protected by session check)
// ─────────────────────────────────────────────────────────

// Helper: redirect to /login if not authenticated (for view routes)
function requireAuthView(req, res, next) {
    if (!req.user) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    next();
}

// Login page (public)
app.get('/login', optionalAuth, (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('auth/login', { error: null, redirect: req.query.redirect || '/' });
});

// Register page (public)
app.get('/register', optionalAuth, (req, res) => {
    if (req.user) return res.redirect('/');
    res.render('auth/register', { error: null });
});

// Home (protected)
app.get('/', optionalAuth, requireAuthView, async (req, res) => {
    try {
        const [cars, bookings] = await Promise.all([
            Car.find(),
            Booking.find().sort({ createdAt: -1 })
        ]);
        const stats = {
            totalCars: cars.length,
            availableCars: cars.filter(c => c.status === 'available').length,
            rentedCars: cars.filter(c => c.status === 'rented').length,
            maintenanceCars: cars.filter(c => c.status === 'maintenance').length,
            totalBookings: bookings.length,
        };
        const recentBookings = bookings.slice(0, 5);
        res.render('index', { stats, recentBookings, user: req.user });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ: ' + err.message);
    }
});

// Cars page (protected)
app.get('/cars', optionalAuth, requireAuthView, async (req, res) => {
    try {
        const cars = await Car.find().sort({ createdAt: -1 });
        res.render('cars', { cars, user: req.user });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ: ' + err.message);
    }
});

// Bookings page (protected)
app.get('/bookings', optionalAuth, requireAuthView, async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.render('bookings', { bookings, user: req.user });
    } catch (err) {
        res.status(500).send('Lỗi máy chủ: ' + err.message);
    }
});

// ─────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const carRoutes = require('./routes/carRoutes');
const { protect: jwtProtect } = require('./middleware/authMiddleware');

// Auth API — public
app.use('/api/auth', authRoutes);

// Cars & Bookings API — protected by JWT
app.use('/api/cars', jwtProtect, carRoutes);
app.use('/api/bookings', jwtProtect, bookingRoutes);

// ─────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    if (err.message && err.message.startsWith('CORS')) {
        return res.status(403).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
});

// ─────────────────────────────────────────────────────────
// MongoDB Connection & Server Start
// ─────────────────────────────────────────────────────────
mongoose.set('strictQuery', true);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/carRental';

async function startServer() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log('✅ MongoDB connected to:', MONGO_URL);
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server is running on port: ${PORT}`);
            console.log(`🔐 JWT auth enabled | CORS origins: ${allowedOrigins.join(', ')}`);
        });
    } catch (err) {
        console.error('❌ Failed to connect:', err);
        process.exit(1);
    }
}

// Export the app for serverless deployment
module.exports = app;

// Only start the server if not in a serverless environment
if (require.main === module) {
    startServer();
}
