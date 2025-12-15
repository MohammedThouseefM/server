const express = require('express');
const router = express.Router();
const { getMe, getUsers, updateProfile, getUserById } = require('../controllers/userController');

router.get('/me', getMe);
router.put('/me', updateProfile);
router.get('/', getUsers);
router.get('/:id', getUserById);

module.exports = router;
