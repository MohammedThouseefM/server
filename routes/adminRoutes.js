const express = require('express');
const router = express.Router();
const {
    adminLogin,
    getDashboardStats,
    getAllUsers,
    deleteUser,
    getSystemActivity,
    deletePost,
    getUserDetails,
    suspendUser,
    updatePost,
    getSuspiciousActivity
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.post('/login', adminLogin);
router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getAllUsers);
router.get('/users/:id', protect, admin, getUserDetails);
router.put('/users/:id/suspend', protect, admin, suspendUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/activity', protect, admin, getSystemActivity);
router.get('/suspicious', protect, admin, getSuspiciousActivity);
router.put('/posts/:id', protect, admin, updatePost);
router.delete('/posts/:id', protect, admin, deletePost);

module.exports = router;
