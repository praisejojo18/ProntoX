const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, full_name, department, points, avatar_url
            FROM users
            WHERE is_active = 1
            ORDER BY points DESC
            LIMIT 15
        `);
        const currentUserId = req.user.id;
        const [rankRows] = await pool.query(
            `SELECT COUNT(*) + 1 as rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)`,
            [currentUserId]
        );
        const currentRank = rankRows[0].rank;
        res.json({
            success: true,
            leaderboard: rows,
            current_user_rank: currentRank
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;