const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// GET /api/admin/ideas – all ideas with full detail
router.get('/ideas', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT i.*, u.full_name as creator_name, u.department as creator_dept,
                   (SELECT COUNT(*) FROM votes WHERE idea_id = i.id) as vote_count
            FROM ideas i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        res.json({ success: true, ideas: rows });
    } catch (error) {
        console.error('Admin ideas error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/admin/users – all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, email, full_name, department, role, points, is_active, created_at FROM users');
        res.json({ success: true, users: rows });
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/admin/users/:id/role – promote/demote
router.patch('/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        res.json({ success: true, message: 'Role updated' });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/admin/users/:id/deactivate
router.patch('/users/:id/deactivate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);
        res.json({ success: true, message: 'User deactivated' });
    } catch (error) {
        console.error('Deactivate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/admin/users/:id/activate
router.patch('/users/:id/activate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [userId]);
        res.json({ success: true, message: 'User activated' });
    } catch (error) {
        console.error('Activate error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;