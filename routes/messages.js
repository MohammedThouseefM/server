const express = require('express');
const router = express.Router();
const { getConversation, sendMessage } = require('../controllers/messageController');

router.get('/:userId', getConversation);
router.post('/:userId', sendMessage);

module.exports = router;
