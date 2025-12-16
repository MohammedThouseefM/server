const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true, // Changed to true for email/password users
        // unique: true, // Temporarily removed to fix migration error
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true, // Ensure email is unique (Application level check for now)
    },
    password: { // Add password field
        type: DataTypes.STRING,
        allowNull: true, // Nullable for Google auth users
    },
    avatar: {
        type: DataTypes.STRING,
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = User;
