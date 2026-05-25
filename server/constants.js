require("dotenv").config();

const DB_NAME     = process.env.DB_NAME;
const DB_USER     = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST     = process.env.DB_HOST;
const DB_PORT     = process.env.DB_PORT || 3306;  // ← agregar esto

const API_VERSION = process.env.API_VERSION || "v1"; ;
const IP_SERVER   = process.env.IP_SERVER;

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

module.exports = {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,        // ← exportar
  API_VERSION,
  IP_SERVER,
  JWT_SECRET_KEY,
};