const { Message, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all conversations (users chatted with)
// @route   GET /api/messages/conversations
// @desc    Get all conversations (users chatted with)
// @route   GET /api/messages/conversations
exports.getConversationsList = async (req, res) => {
    const currentUserId = req.user.id;

    try {
        // Find all messages where current user is sender OR receiver
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId },
                ],
            },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'displayName', 'avatar'] },
                { model: User, as: 'Receiver', attributes: ['id', 'displayName', 'avatar'] },
            ],
        });

        const conversationsMap = new Map();

        messages.forEach(msg => {
            const otherUser = msg.senderId === currentUserId ? msg.Receiver : msg.Sender;

            // Should not happen if data integrity is good, but safety check
            if (!otherUser) return;

            if (!conversationsMap.has(otherUser.id)) {
                conversationsMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: {
                        content: msg.content,
                        createdAt: msg.createdAt,
                        senderId: msg.senderId,
                        isRead: msg.isRead
                    },
                    unreadCount: 0
                });
            }

            // Calculate unread count (if I am the receiver and message is not read)
            if (msg.receiverId === currentUserId && !msg.isRead) {
                const convo = conversationsMap.get(otherUser.id);
                convo.unreadCount += 1;
            }
        });

        const conversations = Array.from(conversationsMap.values());

        res.json(conversations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
exports.markAsRead = async (req, res) => {
    const { userId } = req.params; // The OTHER user info (sender of messages)
    const currentUserId = req.user.id;

    try {
        await Message.update(
            { isRead: true },
            {
                where: {
                    senderId: userId,
                    receiverId: currentUserId,
                    isRead: false
                }
            }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

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
