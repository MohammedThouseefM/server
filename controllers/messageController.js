const { Message, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get conversation with a specific user
// @route   GET /api/messages/:userId
exports.getConversation = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId },
                ],
            },
            order: [['createdAt', 'ASC']],
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'displayName', 'avatar'] },
                { model: User, as: 'Receiver', attributes: ['id', 'displayName', 'avatar'] },
            ],
        });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Send a message
// @route   POST /api/messages/:userId
exports.sendMessage = async (req, res) => {
    const { userId } = req.params; // Receiver ID
    const { content } = req.body;

    try {
        const message = await Message.create({
            senderId: req.user.id,
            receiverId: userId,
            content,
        });

        const fullMessage = await Message.findOne({
            where: { id: message.id },
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'displayName', 'avatar'] },
                { model: User, as: 'Receiver', attributes: ['id', 'displayName', 'avatar'] },
            ],
        });

        res.json(fullMessage);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
