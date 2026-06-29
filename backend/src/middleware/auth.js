const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [rows] = await pool.query(
            'SELECT id, email, full_name, role, points, department, avatar_url, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        if (!rows[0].is_active) {
            return res.status(403).json({ success: false, message: 'Account deactivated' });
        }

        req.user = rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = authMiddleware;