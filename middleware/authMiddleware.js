// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * protect — verifies JWT from Authorization header OR cookie.
 * Attaches req.user on success.
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check Authorization header: "Bearer <token>"
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // 2. Fallback: check httpOnly cookie
        if (!token && req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.'
            });
        }

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser || !currentUser.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không còn tồn tại hoặc đã bị vô hiệu hóa.'
            });
        }

        // 5. Attach user to request
        req.user = currentUser;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Token không hợp lệ.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token đã hết hạn. Vui lòng đăng nhập lại.' });
        }
        return res.status(500).json({ success: false, message: 'Lỗi xác thực.' });
    }
};

/**
 * restrictTo — only allow specific roles.
 * Usage: restrictTo('admin')
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${roles.join(', ')}`
            });
        }
        next();
    };
};

/**
 * optionalAuth — attach user if token present, but don't block if not.
 * Useful for view routes that show different content for logged-in users.
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        if (!token && req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user && user.isActive) req.user = user;
        }
    } catch (_) { /* ignore errors */ }
    next();
};
