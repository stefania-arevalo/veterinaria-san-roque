const express = require("express");
const AuthController = require("../controllers/auth");
const { validateRegister, validateLogin, validateRefresh } = require("../validators/auth");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/auth/register", validateRegister, validate, AuthController.register);
api.post("/auth/login", validateLogin, validate, AuthController.login);
api.post("/auth/refresh_access_token", validateRefresh, validate, AuthController.refreshAccessToken);

module.exports = api;