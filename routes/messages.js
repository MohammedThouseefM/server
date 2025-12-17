const express = require('express');
const router = express.Router();
const { getConversation, sendMessage } = require('../controllers/messageController');

const { protect } = require('../middleware/authMiddleware');

router.get('/:userId', protect, getConversation);
router.post('/:userId', protect, sendMessage);

module.exports = router;
