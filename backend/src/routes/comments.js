const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { awardPoints } = require('../utils/points');

const router = express.Router();

// GET /api/comments/:ideaId
router.get('/:ideaId', authMiddleware, async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const [rows] = await pool.query(`
            SELECT c.*, u.full_name as user_name, u.department
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.idea_id = ?
            ORDER BY c.created_at ASC
        `, [ideaId]);
        res.json({ success: true, comments: rows });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/comments
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { idea_id, content } = req.body;
        const userId = req.user.id;

        const [idea] = await pool.query('SELECT user_id, title FROM ideas WHERE id = ?', [idea_id]);
        if (idea.length === 0) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }

        const [result] = await pool.query(
            'INSERT INTO comments (user_id, idea_id, content) VALUES (?, ?, ?)',
            [userId, idea_id, content]
        );

        await awardPoints(userId, 2, `Commented on idea "${idea[0].title}"`);
        res.status(201).json({
            success: true,
            message: 'Comment added',
            commentId: result.insertId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/comments/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        const [comment] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
        if (comment.length === 0) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        if (comment[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;