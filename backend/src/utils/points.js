const pool = require('../config/db');

const awardPoints = async (userId, points, reason) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [points, userId]);
        await connection.query(
            'INSERT INTO points_log (user_id, points, reason) VALUES (?, ?, ?)',
            [userId, points, reason]
        );
        await connection.commit();
        console.log(`✅ ${points} points awarded to user ${userId}: ${reason}`);
    } catch (error) {
        await connection.rollback();
        console.error('Error awarding points:', error);
        throw error;
    } finally {
        connection.release();
    }
};

const deductPoints = async (userId, points, reason) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT points FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) throw new Error('User not found');
        if (rows[0].points < points) throw new Error('Insufficient points');

        await connection.query('UPDATE users SET points = points - ? WHERE id = ?', [points, userId]);
        await connection.query(
            'INSERT INTO points_log (user_id, points, reason) VALUES (?, ?, ?)',
            [userId, -points, reason]
        );
        await connection.commit();
        console.log(`✅ ${points} points deducted from user ${userId}: ${reason}`);
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { awardPoints, deductPoints };