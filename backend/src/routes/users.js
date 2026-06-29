const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `user_${req.user.id}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// POST /api/users/avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.json({
            success: true,
            avatar_url: avatarUrl
        });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

module.exports = router;