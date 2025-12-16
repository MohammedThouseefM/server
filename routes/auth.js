const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
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

        user = await User.create({
            displayName,
            email,
            password: hashedPassword,
        });

        // Login user after registration
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error logging in after registration' });
            }
            return res.status(201).json(user);
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: 'Server error' });
        }
        if (!user) {
            return res.status(400).json({ message: info.message || 'Login failed' });
        }
        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error logging in' });
            }
            return res.status(200).json(user);
        });
    })(req, res, next);
});

// @desc    Auth with Google
// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /auth/google/callback
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Redirect to frontend dashboard
        res.redirect('https://taptoconnect.netlify.app/feed');
    }
);

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('https://taptoconnect.netlify.app/');
    });
});

module.exports = router;
