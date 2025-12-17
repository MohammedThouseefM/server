const express = require('express');
const router = express.Router();
const { getPosts, createPost, toggleLike, addComment, getComments, updatePost, deletePost } = require('../controllers/postController');

const { protect } = require('../middleware/authMiddleware');

router.get('/', getPosts);
router.post('/', protect, createPost);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', getComments);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

module.exports = router;
