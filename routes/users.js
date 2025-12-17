const express = require('express');
const router = express.Router();
const { getMe, getUsers, updateProfile, getUserById, getSuggestedUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/', getUsers);
router.get('/:id', getUserById);

module.exports = router;
