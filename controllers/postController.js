const { Post, User, Like, Comment, Notification } = require('../models');

// @desc    Get all posts (with optional ?following=true)
// @route   GET /api/posts
exports.getPosts = async (req, res) => {
    try {
        const { userId } = req.query;
        let whereClause = {};

        if (userId) {
            // Filter by specific user (Public Profile)
            whereClause = {
                userId: userId
            };
        }

        const posts = await Post.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    attributes: ['id', 'displayName', 'avatar'],
                },
                {
                    model: Like,
                    attributes: ['userId'],
                },
                {
                    model: Comment,
                    attributes: ['id'],
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a post
// @route   POST /api/posts
exports.createPost = async (req, res) => {
    const { content, image } = req.body;

    try {
        const newPost = await Post.create({
            content,
            image,
            userId: req.user.id,
        });

        const post = await Post.findOne({
            where: { id: newPost.id },
            include: {
                model: User,
                attributes: ['id', 'displayName', 'avatar'],
            },
        });

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Toggle Like on a post
// @route   POST /api/posts/:id/like
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const existingLike = await Like.findOne({
            where: {
                userId: req.user.id,
                postId: req.params.id
            }
        });

        if (existingLike) {
            await existingLike.destroy();
            res.json({ msg: 'Post unliked', liked: false });
        } else {
            await Like.create({
                userId: req.user.id,
                postId: req.params.id
            });

            // Create Notification
            if (post.userId !== req.user.id) {
                await Notification.create({
                    userId: post.userId,
                    actorId: req.user.id,
                    type: 'LIKE',
                    referenceId: post.id,
                });
            }

            res.json({ msg: 'Post liked', liked: true });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comments
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        const newComment = await Comment.create({
            content,
            userId: req.user.id,
            postId: req.params.id
        });

        const commentWithUser = await Comment.findByPk(newComment.id, {
            include: [{ model: User, attributes: ['id', 'displayName', 'avatar'] }]
        });

        // Create Notification
        if (post.userId !== req.user.id) {
            await Notification.create({
                userId: post.userId,
                actorId: req.user.id,
                type: 'COMMENT',
                referenceId: post.id,
            });
        }

        res.json(commentWithUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.findAll({
            where: { postId: req.params.id },
            include: [{ model: User, attributes: ['id', 'displayName', 'avatar'] }],
            order: [['createdAt', 'ASC']]
        });
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
