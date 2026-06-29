const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seed() {
    try {
        console.log('🌱 Starting database seed...');
        await pool.query('DELETE FROM redemptions');
        await pool.query('DELETE FROM points_log');
        await pool.query('DELETE FROM votes');
        await pool.query('DELETE FROM comments');
        await pool.query('DELETE FROM ideas');
        await pool.query('DELETE FROM users');
        await pool.query('DELETE FROM rewards');

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('password123', saltRounds);

        const users = [
            { email: 'admin@pronto.ai', full_name: 'Admin User', department: 'IT', role: 'admin', points: 0 },
            { email: 'chidi@pronto.ai', full_name: 'Chidi Okafor', department: 'Engineering', role: 'user', points: 1250 },
            { email: 'fatima@pronto.ai', full_name: 'Fatima Yusuf', department: 'Product', role: 'user', points: 5200 },
            { email: 'amina@pronto.ai', full_name: 'Amina Bello', department: 'Engineering', role: 'user', points: 3400 },
            { email: 'oluwaseun@pronto.ai', full_name: 'Oluwaseun A.', department: 'Cybersecurity', role: 'user', points: 1100 },
            { email: 'emeka@pronto.ai', full_name: 'Emeka N.', department: 'Product', role: 'user', points: 950 },
            { email: 'zainab@pronto.ai', full_name: 'Zainab O.', department: 'HR', role: 'user', points: 880 },
            { email: 'tunde@pronto.ai', full_name: 'Tunde A.', department: 'Ops', role: 'user', points: 790 },
            { email: 'chioma@pronto.ai', full_name: 'Chioma N.', department: 'Finance', role: 'user', points: 710 },
            { email: 'efe@pronto.ai', full_name: 'Efe Paul', department: 'Marketing', role: 'user', points: 650 },
        ];

        const userIds = {};
        for (const user of users) {
            const [result] = await pool.query(
                `INSERT INTO users (email, password, full_name, department, role, points)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [user.email, hashedPassword, user.full_name, user.department, user.role, user.points]
            );
            userIds[user.email] = result.insertId;
        }
        console.log(`✅ ${users.length} users inserted.`);

        // Insert some ideas
        const ideas = [
            { user_id: userIds['chidi@pronto.ai'], title: 'Self-service password reset',
              description: 'Allow users to reset their own passwords securely.',
              problem: 'Users frequently forget passwords, causing helpdesk overload.',
              solution: 'Implement a secure self-service password reset portal.',
              category: 'IT', status: 'submitted' },
            { user_id: userIds['fatima@pronto.ai'], title: 'OLT offline auto-alert',
              description: 'SMS alert to NOC team when an OLT goes offline.',
              problem: 'OLT outages are often detected late, causing service degradation.',
              solution: 'Automated monitoring with instant SMS notifications.',
              category: 'OLS', status: 'review' },
            { user_id: userIds['amina@pronto.ai'], title: 'Flexible Friday hours',
              description: 'Core hours 10-2, flexible otherwise.',
              problem: 'Rigid working hours reduce employee satisfaction.',
              solution: 'Core hours with flexible scheduling.',
              category: 'HR', status: 'implemented' },
        ];
        for (const idea of ideas) {
            await pool.query(
                `INSERT INTO ideas (user_id, title, description, problem, solution, category, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [idea.user_id, idea.title, idea.description, idea.problem, idea.solution, idea.category, idea.status]
            );
        }
        console.log(`✅ ${ideas.length} ideas inserted.`);
        console.log('🎉 Seed complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();