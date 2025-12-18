const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const generateToken = require('../utils/jwt');
const router = express.Router();

// @desc    Register user
// @route   POST /auth/register
router.post('/register', async (req, res) => {
    const { displayName, email, password } = req.body;

    try {
        let user = await User.findOne({ where: { email } });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

        user = await User.create({
            displayName,
            email,
            password: hashedPassword,
            avatar
        });

        res.status(201).json({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatar: user.avatar,
            token: generateToken(user.id),
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.isSuspended) {
                return res.status(403).json({ message: 'Your account has been suspended. Contact admin.' });
            }

            res.json({
                id: user.id,
                displayName: user.displayName,
                email: user.email,
                avatar: user.avatar,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: 'https://taptoconnect.netlify.app/login' }),
    (req, res) => {
        if (req.user.isSuspended) {
            return res.redirect('https://taptoconnect.netlify.app/login?error=suspended');
        }
        const token = generateToken(req.user.id);
        // Redirect to frontend with token
        res.redirect(`https://taptoconnect.netlify.app/feed?token=${token}`);
    }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res) => {
    // Client-side logout logic handles clearing token
    res.redirect('https://taptoconnect.netlify.app/');
});

module.exports = router;
