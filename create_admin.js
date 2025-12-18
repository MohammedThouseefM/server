require('dotenv').config();
const { User } = require('./models');
const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync models to ensure table structure is up to date
        console.log('Syncing database schema...');
        await sequelize.sync({ alter: true });
        console.log('Database synced.');

        const email = 'admin@taptoconnect.com';
        const password = 'admin@3147';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: {
                displayName: 'Admin User',
                password: hashedPassword,
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
                isSuspended: false
            }
        });

        if (created) {
            console.log('\nSUCCESS: Admin user created.');
        } else {
            console.log('\nSUCCESS: Admin user updated.');
            user.role = 'admin';
            user.password = hashedPassword;
            await user.save();
        }

        console.log('------------------------------------------------');
        console.log('Admin Login URL: http://localhost:5173/useradmin43176');
        console.log('Email:          ' + email);
        console.log('Password:       ' + password);
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await sequelize.close();
    }
};

createAdmin();
