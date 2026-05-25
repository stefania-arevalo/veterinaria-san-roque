// routes/reports.js
const express = require("express");
const ReportsController = require("../controllers/reports");
const md_auth = require("../middlewares/authenticated");

const api = express.Router();

// Solo admin (idRol: 1) puede acceder a reportes
api.get("/reports", [md_auth.asureAuth, md_auth.hasRole([1])], ReportsController.getReports);

module.exports = api;