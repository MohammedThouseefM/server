const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Define CA path
const caPath = process.env.DB_CA_PATH
    ? path.resolve(__dirname, '..', process.env.DB_CA_PATH)
    : path.resolve(__dirname, '../ca.pem');

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            dialect: 'mysql',
            logging: false,
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: true,
                    ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined
                }
            }
        }
    );

module.exports = sequelize;
