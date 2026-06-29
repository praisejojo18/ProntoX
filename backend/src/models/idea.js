const pool = require('../config/db');

const Idea = {
    create: async (userId, title, description, problem, solution, category, isAnonymous) => {
        const [result] = await pool.query(
            `INSERT INTO ideas (user_id, title, description, problem, solution, category, is_anonymous)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, title, description, problem, solution, category, isAnonymous || false]
        );
        return result.insertId;
    },
    findById: async (id) => {
        const [rows] = await pool.query(`
            SELECT i.*, u.full_name as creator_name, u.department as creator_dept,
                   (SELECT COUNT(*) FROM votes WHERE idea_id = i.id) as vote_count,
                   (SELECT COUNT(*) FROM comments WHERE idea_id = i.id) as comment_count
            FROM ideas i
            JOIN users u ON i.user_id = u.id
            WHERE i.id = ?
        `, [id]);
        return rows[0];
    },
    findAll: async (filters) => {
        const { status, category, sort, limit = 20, offset = 0 } = filters;
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
        return rows;
    },
    updateStatus: async (id, status) => {
        await pool.query('UPDATE ideas SET status = ? WHERE id = ?', [status, id]);
    },
    updateScore: async (id, score, feedback) => {
        await pool.query('UPDATE ideas SET score = ?, feedback = ? WHERE id = ?', [score, feedback, id]);
    },
    updateOutcome: async (id, outcomeNote) => {
        await pool.query('UPDATE ideas SET outcome_note = ? WHERE id = ?', [outcomeNote, id]);
    },
    delete: async (id) => {
        await pool.query('DELETE FROM ideas WHERE id = ?', [id]);
    },
    getOwner: async (id) => {
        const [rows] = await pool.query('SELECT user_id, title FROM ideas WHERE id = ?', [id]);
        return rows[0];
    },
    getAllAdmin: async () => {
        const [rows] = await pool.query(`
            SELECT i.*, u.full_name as creator_name, u.department as creator_dept,
                   (SELECT COUNT(*) FROM votes WHERE idea_id = i.id) as vote_count
            FROM ideas i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        return rows;
    }
};

module.exports = Idea;