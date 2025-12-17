const { User, Notification } = require('../models');

// @desc    Get current user
// @route   GET /api/users/me
exports.getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Reload user to ensure we have latest data
        const user = await User.findByPk(req.user.id);

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get suggested users (not in active conversations)
// @route   GET /api/users/suggestions
exports.getSuggestedUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { Message } = require('../models');
        const { Op } = require('sequelize');

        // 1. Find all users the current user has chatted with
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId },
                ],
            },
            attributes: ['senderId', 'receiverId'],
        });

        const interactedUserIds = new Set();
        messages.forEach(msg => {
            if (msg.senderId !== currentUserId) interactedUserIds.add(msg.senderId);
            if (msg.receiverId !== currentUserId) interactedUserIds.add(msg.receiverId);
        });

        // 2. Find users NOT in that set (and not self)
        const suggestions = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: [...interactedUserIds, currentUserId]
                }
            },
            attributes: ['id', 'displayName', 'avatar'],
            limit: 10, // Limit suggestions
            order: [['createdAt', 'DESC']] // Newest users first, or use SQL random()
        });

        res.json(suggestions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all users (search)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'displayName', 'avatar'], // Exclude sensitive data if any
        });
        // Filter out current user
        const filteredUsers = req.user
            ? users.filter(user => user.id !== req.user.id)
            : users;

        res.json(filteredUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user by ID (Public Profile)
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: ['id', 'displayName', 'avatar', 'bio', 'gender', 'createdAt']
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update user profile
// @route   PUT /api/users/me
exports.updateProfile = async (req, res) => {
    const { displayName, bio, gender } = req.body;

    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.displayName = displayName || user.displayName;
            user.bio = bio || user.bio;
            user.gender = gender || user.gender;

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ msg: 'User not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};



