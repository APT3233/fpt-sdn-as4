// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// ─── Helper: sign JWT ──────────────────────────────────
function signToken(userId) {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

// ─── Helper: send token in both JSON body and httpOnly cookie ──
function sendTokenResponse(user, statusCode, res, message) {
    const token = signToken(user._id);

    // Cookie options — httpOnly so JS can't read it (XSS protection)
    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    };

    res
        .status(statusCode)
        .cookie('jwt', token, cookieOptions)
        .json({
            success: true,
            message,
            token,
            user: user.toPublicJSON()
        });
}

// ─── POST /api/auth/register ───────────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ: tên, email và mật khẩu.'
            });
        }

        // Check for existing email
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email này đã được đăng ký. Vui lòng dùng email khác.'
            });
        }

        // Only allow 'admin' role if explicitly passed AND no admin exists yet
        let assignedRole = 'user';
        if (role === 'admin') {
            const adminExists = await User.findOne({ role: 'admin' });
            if (!adminExists) assignedRole = 'admin'; // First user becomes admin
        }

        const user = await User.create({ name, email, password, role: assignedRole });

        sendTokenResponse(user, 201, res, `Đăng ký thành công! Chào mừng ${user.name}!`);
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + err.message });
    }
};

// ─── POST /api/auth/login ──────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu.'
            });
        }

        // Explicitly select password (it's excluded by default)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng.'
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng.'
            });
        }

        sendTokenResponse(user, 200, res, `Đăng nhập thành công! Chào ${user.name}!`);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + err.message });
    }
};

// ─── POST /api/auth/logout ─────────────────────────────
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 1000), // expire immediately
        httpOnly: true
    });
    res.status(200).json({ success: true, message: 'Đã đăng xuất thành công.' });
};

// ─── GET /api/auth/me ──────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success: true,
            user: user.toPublicJSON()
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── GET /api/auth/users (admin only) ─────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            users: users.map(u => u.toPublicJSON())
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
