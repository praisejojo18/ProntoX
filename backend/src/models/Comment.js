const pool = require('../config/db');

const Comment = {
    create: async (userId, ideaId, content) => {
        const [result] = await pool.query(
            'INSERT INTO comments (user_id, idea_id, content) VALUES (?, ?, ?)',
            [userId, ideaId, content]
        );
        return result.insertId;
    },
    findByIdea: async (ideaId) => {
        const [rows] = await pool.query(`
            SELECT c.*, u.full_name as user_name, u.department
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.idea_id = ?
            ORDER BY c.created_at ASC
        `, [ideaId]);
        return rows;
    },
    findById: async (id) => {
        const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
        return rows[0];
    },
    delete: async (id) => {
        await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    },
    countByIdea: async (ideaId) => {
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM comments WHERE idea_id = ?', [ideaId]);
        return rows[0].count;
    }
};

module.exports = Comment;
