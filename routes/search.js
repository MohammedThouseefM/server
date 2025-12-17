const express = require('express');
const router = express.Router();
const { searchAll, getHistory, clearHistory, deleteHistoryItem } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, searchAll);
router.get('/history', protect, getHistory);
router.delete('/history', protect, clearHistory);
router.delete('/history/:id', protect, deleteHistoryItem);

module.exports = router;
