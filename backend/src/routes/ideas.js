const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { awardPoints } = require('../utils/points');

const router = express.Router();

// GET /api/ideas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, category, sort, limit = 20, offset = 0 } = req.query;
        let sql = `
            SELECT i.*, u.full_name as creator_name, u.department as creator_dept,
                   (SELECT COUNT(*) FROM votes WHERE idea_id = i.id) as vote_count,
                   (SELECT COUNT(*) FROM comments WHERE idea_id = i.id) as comment_count
            FROM ideas i
            JOIN users u ON i.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        if (status) { sql += ' AND i.status = ?'; params.push(status); }
        if (category) { sql += ' AND i.category = ?'; params.push(category); }
        if (sort === 'most_voted') sql += ' ORDER BY vote_count DESC';
        else sql += ' ORDER BY i.created_at DESC';
        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(sql, params);
        res.json({ success: true, ideas: rows });
    } catch (error) {
        console.error('Get ideas error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/ideas/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const ideaId = req.params.id;
        const [ideaRows] = await pool.query(`
            SELECT i.*, u.full_name as creator_name, u.department as creator_dept,
                   (SELECT COUNT(*) FROM votes WHERE idea_id = i.id) as vote_count,
                   (SELECT COUNT(*) FROM comments WHERE idea_id = i.id) as comment_count
            FROM ideas i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `, [ideaId]);
        if (ideaRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }
        const idea = ideaRows[0];
        const [comments] = await pool.query(`
            SELECT c.*, u.full_name as user_name, u.department
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.idea_id = ?
            ORDER BY c.created_at DESC
        `, [ideaId]);
        const [voteCheck] = await pool.query(
            'SELECT * FROM votes WHERE user_id = ? AND idea_id = ?',
            [req.user.id, ideaId]
        );
        const userVoted = voteCheck.length > 0;
        res.json({
            success: true,
            idea: { ...idea, comments, userVoted }
        });
    } catch (error) {
        console.error('Get idea error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/ideas
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, description, problem, solution, category, is_anonymous } = req.body;
        const userId = req.user.id;
        const [result] = await pool.query(
            `INSERT INTO ideas (user_id, title, description, problem, solution, category, is_anonymous)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, description, problem, solution, category, is_anonymous || false]
        );
        await awardPoints(userId, 100, `Submitted idea: "${title}"`);
        res.status(201).json({
            success: true,
            message: 'Idea submitted successfully',
            ideaId: result.insertId
        });
    } catch (error) {
        console.error('Create idea error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/ideas/:id/status (admin only)
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const ideaId = req.params.id;
        const [idea] = await pool.query('SELECT user_id, title FROM ideas WHERE id = ?', [ideaId]);
        if (idea.length === 0) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }
        await pool.query('UPDATE ideas SET status = ? WHERE id = ?', [status, ideaId]);
        if (status === 'implemented') {
            await awardPoints(idea[0].user_id, 50, `Idea "${idea[0].title}" implemented`);
        }
        res.json({ success: true, message: 'Status updated' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/ideas/:id/score (admin only)
router.patch('/:id/score', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { score, feedback } = req.body;
        const ideaId = req.params.id;
        await pool.query('UPDATE ideas SET score = ?, feedback = ? WHERE id = ?', [score, feedback, ideaId]);
        res.json({ success: true, message: 'Score and feedback updated' });
    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/ideas/:id/outcome (admin only)
router.patch('/:id/outcome', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { outcome_note } = req.body;
        const ideaId = req.params.id;
        await pool.query('UPDATE ideas SET outcome_note = ? WHERE id = ?', [outcome_note, ideaId]);
        res.json({ success: true, message: 'Outcome note updated' });
    } catch (error) {
        console.error('Update outcome error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/ideas/:id (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const ideaId = req.params.id;
        await pool.query('DELETE FROM ideas WHERE id = ?', [ideaId]);
        res.json({ success: true, message: 'Idea deleted' });
    } catch (error) {
        console.error('Delete idea error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;