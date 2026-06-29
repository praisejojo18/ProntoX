const Comment = require('../models/Comment');
const Idea = require('../models/Idea');
const { awardPoints } = require('../utils/points');

const getComments = async (req, res) => {
    try {
        const ideaId = req.params.ideaId;
        const comments = await Comment.findByIdea(ideaId);
        res.json({ success: true, comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const addComment = async (req, res) => {
    try {
        const { idea_id, content } = req.body;
        const userId = req.user.id;

        const idea = await Idea.getOwner(idea_id);
        if (!idea) {
            return res.status(404).json({ success: false, message: 'Idea not found' });
        }

        const commentId = await Comment.create(userId, idea_id, content);
        await awardPoints(userId, 2, `Commented on idea "${idea.title}"`);
        res.status(201).json({
            success: true,
            message: 'Comment added',
            commentId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        if (comment.user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await Comment.delete(commentId);
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getComments, addComment, deleteComment };