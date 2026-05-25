const { Sequelize } = require("sequelize");
const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST } = require("./constants");

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    dialect: "mysql",
    logging: false, // Para que no llene la consola de consultas SQL
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000 // ← cierra conexiones inactivas antes de que MySQL las mate
    },
    dialectOptions: {
        connectTimeout: 60000
    }
});

module.exports = sequelize;