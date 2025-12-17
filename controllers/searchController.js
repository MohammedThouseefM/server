const { User, Post, SearchHistory, Sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Search users and posts
// @route   GET /api/search
exports.searchAll = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json({ users: [], posts: [] });
        }

        const query = q.trim();

        // 1. Search Users (displayName or email)
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { displayName: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } }
                ]
            },
            attributes: ['id', 'displayName', 'avatar'],
            limit: 5 // Limit results for better performance in dropdown
        });

        // 2. Search Posts (content)
        const posts = await Post.findAll({
            where: {
                content: { [Op.like]: `%${query}%` }
            },
            include: [
                { model: User, attributes: ['id', 'displayName', 'avatar'] }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        // 3. Save to History (Async - fire and forget mostly, but we define distinct handling)
        // Check if identical recent query exists to avoid spam?
        // For simplicity: Add it.
        const existingHistory = await SearchHistory.findOne({
            where: { userId: req.user.id, query: query }
        });

        if (existingHistory) {
            // Update timestamp
            existingHistory.changed('updatedAt', true);
            await existingHistory.save();
        } else {
            // Check count to prevent infinite growth? Limit to last 20? 
            // Simple approach: Create. Frontend/Cleanup can handle limits.
            await SearchHistory.create({
                userId: req.user.id,
                query: query
            });
        }

        res.json({ users, posts });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get search history
// @route   GET /api/search/history
exports.getHistory = async (req, res) => {
    try {
        const history = await SearchHistory.findAll({
            where: { userId: req.user.id },
            order: [['updatedAt', 'DESC']], // Recently used/searched
            limit: 10
        });
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Clear all search history
// @route   DELETE /api/search/history
exports.clearHistory = async (req, res) => {
    try {
        await SearchHistory.destroy({
            where: { userId: req.user.id }
        });
        res.json({ msg: 'Search history cleared' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete specific history item
// @route   DELETE /api/search/history/:id
exports.deleteHistoryItem = async (req, res) => {
    try {
        await SearchHistory.destroy({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });
        res.json({ msg: 'Item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
