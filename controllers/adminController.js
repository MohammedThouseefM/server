const { User, Post, Message } = require('../models');
const generateToken = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// @desc    Admin Login
// @route   POST /api/admin/login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied: Admins only' });
            }

            res.json({
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.count();
        const postCount = await Post.count();
        const messageCount = await Message.count();

        // Simple "Active Today" metric (mock logic if lastActive not available, or use createdAt for now)
        // Ideally we'd filter by updatedAt > 24h ago
        // For now, returning total counts.

        res.json({
            users: userCount,
            posts: postCount,
            messages: messageCount,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (user) {
            await user.destroy();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get System Activity (Recent Posts & Messages)
// @route   GET /api/admin/activity
const getSystemActivity = async (req, res) => {
    try {
        const posts = await Post.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, attributes: ['displayName', 'email'] }]
        });
        const messages = await Message.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'sender', attributes: ['displayName', 'email'] }]
        });

        res.json({ posts, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete Post
// @route   DELETE /api/admin/posts/:id
const deletePost = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);

        if (post) {
            await post.destroy();
            res.json({ message: 'Post removed' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Detailed User Info (Profile + Posts + Messages)
// @route   GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await Post.findAll({
            where: { UserId: req.params.id },
            order: [['createdAt', 'DESC']]
        });

        // Fetch messages sent by this user
        const messages = await Message.findAll({
            where: { senderId: req.params.id },
            include: [{ model: User, as: 'receiver', attributes: ['displayName'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ user, posts, messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Suspend/Unsuspend User
// @route   PUT /api/admin/users/:id/suspend
const suspendUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (user) {
            user.isSuspended = !user.isSuspended;
            await user.save();
            res.json({ message: user.isSuspended ? 'User suspended' : 'User activated', isSuspended: user.isSuspended });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update Post Content (Moderation)
// @route   PUT /api/admin/posts/:id
const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findByPk(req.params.id);

        if (post) {
            post.content = content;
            await post.save();
            res.json({ message: 'Post updated', post });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Suspicious Activity (Keyword match)
// @route   GET /api/admin/suspicious
const getSuspiciousActivity = async (req, res) => {
    try {
        const { Op } = require('sequelize');
        const keywords = ['spam', 'scam', 'hate', 'money', 'free', 'click'];

        const operator = { [Op.or]: keywords.map(k => ({ [Op.like]: `%${k}%` })) };

        const suspiciousPosts = await Post.findAll({
            where: { content: operator },
            include: [{ model: User, attributes: ['displayName', 'email'] }],
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        // Search messages too if model supports it (assuming Message content exists)
        const suspiciousMessages = await Message.findAll({
            where: { content: operator },
            include: [{ model: User, as: 'sender', attributes: ['displayName', 'email'] }],
            limit: 10,
            order: [['createdAt', 'DESC']]
        });

        res.json({ posts: suspiciousPosts, messages: suspiciousMessages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    adminLogin,
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getSystemActivity,
    deletePost,
    getUserDetails,
    suspendUser,
    updatePost,
    getSuspiciousActivity
};
