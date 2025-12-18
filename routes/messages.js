const express = require('express');
const router = express.Router();
const { getConversation, sendMessage, getConversationsList, markAsRead } = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversationsList);
router.put('/read/:userId', protect, markAsRead);
router.get('/:userId', protect, getConversation);
router.post('/:userId', protect, sendMessage);

module.exports = router;
