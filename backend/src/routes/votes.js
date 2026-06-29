const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { awardPoints, deductPoints } = require('../utils/points');

const router = express.Router();

// POST /api/votes
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { idea_id } = req.body;
        const userId = req.user.id;

        // Prevent voting on own idea
        const [ideaOwner] = await pool.query('SELECT user_id, title FROM ideas WHERE id = ?', [idea_id]);
        if (ideaOwner.length === 0) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }
        if (ideaOwner[0].user_id === userId) {
            return res.status(400).json({ success: false, message: 'Cannot vote on your own idea' });
        }

        const [existing] = await pool.query(
            'SELECT * FROM votes WHERE user_id = ? AND idea_id = ?',
            [userId, idea_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Already voted' });
        }

        // Insert vote
        await pool.query('INSERT INTO votes (user_id, idea_id) VALUES (?, ?)', [userId, idea_id]);

        // Award 1 point to the voter (for engaging)
        await awardPoints(userId, 1, `Voted on idea "${ideaOwner[0].title}"`);

        // Award 1 point to the idea owner (for receiving vote)
        await awardPoints(ideaOwner[0].user_id, 1, `Upvote received on idea "${ideaOwner[0].title}"`);

        res.status(201).json({ success: true, message: 'Upvoted successfully' });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/votes/:ideaId
router.delete('/:ideaId', authMiddleware, async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const userId = req.user.id;

        // Get idea owner
        const [idea] = await pool.query('SELECT user_id, title FROM ideas WHERE id = ?', [ideaId]);
        if (idea.length === 0) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }

        // Check if vote exists
        const [vote] = await pool.query(
            'SELECT * FROM votes WHERE user_id = ? AND idea_id = ?',
            [userId, ideaId]
        );
        if (vote.length === 0) {
            return res.status(400).json({ success: false, message: 'No vote to remove' });
        }

        // Delete vote
        await pool.query('DELETE FROM votes WHERE user_id = ? AND idea_id = ?', [userId, ideaId]);

        // Reverse points (deduct 1 from both voter and idea owner)
        await deductPoints(userId, 1, `Removed vote on idea "${idea[0].title}"`);
        await deductPoints(idea[0].user_id, 1, `Upvote removed from idea "${idea[0].title}"`);

        res.json({ success: true, message: 'Upvote removed' });
    } catch (error) {
        console.error('Remove upvote error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/votes/:ideaId
router.get('/:ideaId', authMiddleware, async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM votes WHERE idea_id = ?', [ideaId]);
        res.json({ success: true, count: rows[0].count });
    } catch (error) {
        console.error('Vote count error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;