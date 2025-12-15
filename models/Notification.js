const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who receives the notification',
    },
    actorId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The user who triggered the notification',
    },
    type: {
        type: DataTypes.ENUM('LIKE', 'COMMENT', 'FOLLOW', 'MESSAGE'),
        allowNull: false,
    },
    referenceId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'The ID of the related entity (post, user, etc.)',
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});

module.exports = Notification;
