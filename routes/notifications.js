const express = require('express');
const router = express.Router();
const { getNotifications, markRead } = require('../controllers/notificationController');

router.get('/', getNotifications);
router.put('/:id/read', markRead);

module.exports = router;
