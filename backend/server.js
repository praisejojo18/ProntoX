require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./src/routes/auth');
const ideaRoutes = require('./src/routes/ideas');
const voteRoutes = require('./src/routes/votes');
const commentRoutes = require('./src/routes/comments');
const leaderboardRoutes = require('./src/routes/leaderboard');
const rewardRoutes = require('./src/routes/rewards');
const adminRoutes = require('./src/routes/admin');
const userRoutes = require('./src/routes/users'); // For avatar & profile

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ProntoX API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 ProntoX API running on port ${PORT}`);
});