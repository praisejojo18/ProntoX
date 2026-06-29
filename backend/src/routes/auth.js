const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, department } = req.body;
        const domain = process.env.COMPANY_EMAIL_DOMAIN || '@pronto.ai';
        if (!email.endsWith(domain)) {
            return res.status(400).json({ success: false, message: `Email must use ${domain} domain` });
        }
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (email, password, full_name, department) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, department]
        );
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account deactivated' });
        }
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                department: user.department,
                role: user.role,
                points: user.points,
                avatar_url: user.avatar_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
});

module.exports = router;

