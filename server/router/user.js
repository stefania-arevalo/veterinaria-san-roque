const express = require("express");
const UserController = require("../controllers/user");
const md_auth = require("../middlewares/authenticated");
const api = express.Router();
const { validateCreateUser, validateUpdateUser, validateId } = require("../validators/user");
const validate = require("../middlewares/validate");


api.get("/user/me", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], UserController.getMe);
api.post("/user", [md_auth.asureAuth, md_auth.hasRole([1]),   validateCreateUser, validate], UserController.createUser);
// R: Admin, Vet, Asis, Vend pueden ver 
api.get("/users", [md_auth.asureAuth, md_auth.hasRole([1])], UserController.getUsers);
// U: Todos entran, el controlador filtra el "Own"
api.patch("/user/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]),      validateUpdateUser, validate], UserController.updateUser);
api.delete("/user/:id", [md_auth.asureAuth, md_auth.hasRole([1]),           validateId,                validate], UserController.deleteUser);

module.exports = api;