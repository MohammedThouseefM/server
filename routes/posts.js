const express = require('express');
const router = express.Router();
const { getPosts, createPost, toggleLike, addComment, getComments } = require('../controllers/postController');

router.get('/', getPosts);
router.post('/', createPost);
router.post('/:id/like', toggleLike);
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

module.exports = router;
