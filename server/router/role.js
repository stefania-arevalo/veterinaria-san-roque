const express = require("express");
const RoleController = require("../controllers/role");
const md_auth = require("../middlewares/authenticated");
const api = express.Router();
const { validateCreateRole, validateUpdateRole, validateId } = require("../validators/role");
const validate = require("../middlewares/validate");

api.post("/role", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateRole, validate], RoleController.createRole);
api.get("/roles", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], RoleController.getRoles)
api.patch("/role/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateUpdateRole, validate], RoleController.updateRole);
api.delete("/role/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId,                validate], RoleController.deleteRole);

module.exports = api;