const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { User } = require('../models');

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.SERVER_URL
                    ? `${process.env.SERVER_URL}/auth/google/callback`
                    : '/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: profile.photos[0].value,
                };

                try {
                    // Check if user exists with googleId
                    let user = await User.findOne({ where: { googleId: profile.id } });

                    if (user) {
                        return done(null, user);
                    }

                    // Check if user exists with email but no googleId (legacy or email user)
                    user = await User.findOne({ where: { email: profile.emails[0].value } });

                    if (user) {
                        // Update user to have googleId
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }

                    user = await User.create(newUser);
                    done(null, user);
                } catch (err) {
                    console.error(err);
                    done(err, null);
                }
            }
        )
    );

    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    return done(null, false, { message: 'That email is not registered' });
                }
                if (!user.password) {
                    return done(null, false, { message: 'Please log in with Google' });
                }

                // Match password
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findByPk(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
