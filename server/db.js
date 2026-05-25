const { Sequelize } = require("sequelize");
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = require("./constants");

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        connectTimeout: 60000,
        ...(isProduction && {
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: false  // ← TiDB Cloud en Render no tiene el CA instalado
            }
        })
    }
});

module.exports = sequelize;