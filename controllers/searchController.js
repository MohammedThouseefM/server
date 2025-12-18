const { User, Post, Message, SearchHistory, Sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Search users and posts
// @route   GET /api/search
exports.searchAll = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.json({ users: [], posts: [], messages: [] });
        }

        const query = q.trim().toLowerCase();

        // 1. Search Users (displayName or email)
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('displayName')), 'LIKE', `%${query}%`),
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('email')), 'LIKE', `%${query}%`)
                ]
            },
            attributes: ['id', 'displayName', 'avatar'],
            limit: 5 // Limit results for better performance in dropdown
        });

        // 2. Search Posts (content)
        const posts = await Post.findAll({
            where: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('content')), 'LIKE', `%${query}%`),
            include: [
                { model: User, attributes: ['id', 'displayName', 'avatar'] }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        // 3. Search Messages (content)
        // Note: In a real app, strict access control is needed here (only messages user is part of).
        // Assuming for this "Search Page" context, we searching GLOBAL messages (like a public forum) 
        // OR we need to filter by req.user.id if these are private messages.
        // Given existing context, let's assume we want to search messages relevant to the user (sent or received).

        const messages = await Message.findAll({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('content')), 'LIKE', `%${query}%`),
                    {
                        [Op.or]: [
                            { senderId: req.user.id },
                            { receiverId: req.user.id }
                        ]
                    }
                ]
            },
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'displayName', 'avatar'] },
                { model: User, as: 'Receiver', attributes: ['id', 'displayName', 'avatar'] }
            ],
            limit: 5,
            order: [['createdAt', 'DESC']]
        });

        // 4. Save to History
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

        res.json({ users, posts, messages });
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
