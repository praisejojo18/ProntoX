const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { deductPoints } = require('../utils/points');
const sendEmail = require('../config/email');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rewards WHERE is_active = 1 ORDER BY points_cost ASC');
        res.json({ success: true, rewards: rows });
    } catch (error) {
        console.error('Get rewards error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/redeem', authMiddleware, async (req, res) => {
    try {
        const { reward_id } = req.body;
        const userId = req.user.id;

        const [rewardRows] = await pool.query('SELECT * FROM rewards WHERE id = ? AND is_active = 1', [reward_id]);
        if (rewardRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Reward not found or inactive' });
        }
        const reward = rewardRows[0];

        const [userRows] = await pool.query('SELECT points, full_name, email FROM users WHERE id = ?', [userId]);
        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = userRows[0];
        if (user.points < reward.points_cost) {
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        await deductPoints(userId, reward.points_cost, `Redeemed: ${reward.name}`);

        const [redemptionResult] = await pool.query(
            `INSERT INTO redemptions (user_id, reward_id, points_spent, status)
             VALUES (?, ?, ?, 'pending')`,
            [userId, reward_id, reward.points_cost]
        );

        // Send email confirmation (non-blocking)
        const emailHtml = `
            <h2>🎉 Redemption Confirmed</h2>
            <p>Hi ${user.full_name},</p>
            <p>You have successfully redeemed <strong>${reward.name}</strong> for ${reward.points_cost.toLocaleString()} points.</p>
            <p>Redemption ID: ${redemptionResult.insertId}</p>
            <p>Thank you for contributing to ProntoX!</p>
        `;
        await sendEmail({
            to: user.email,
            subject: `🎉 You Redeemed ${reward.name}!`,
            html: emailHtml,
        }).catch(() => {});

        res.json({
            success: true,
            message: `Redeemed ${reward.name} successfully`,
            redemptionId: redemptionResult.insertId,
            newBalance: user.points - reward.points_cost
        });
    } catch (error) {
        console.error('Redeem error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

module.exports = router;