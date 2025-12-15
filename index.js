const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
require('./models'); // Import models to associate them
const passport = require('passport');

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const session = require('express-session');
require('./config/passport')(passport);

// Middleware
app.use(cors());
app.use(express.json());

// Session config
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Database Connection
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
        // Sync models
        await sequelize.sync(); // Removed { alter: true } to prevent "Too many keys" error
        console.log('Models synced...');
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

connectDB();

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
