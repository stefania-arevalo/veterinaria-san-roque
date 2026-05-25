const express = require("express");
const AdminController = require("../controllers/admin");
const md_auth = require("../middlewares/authenticated");
const { validateCreateAdmin, validateUpdateAdmin, validateId } = require("../validators/admin");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/admin", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateAdmin, validate], AdminController.createAdmin);

api.get("/admins", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], AdminController.getAdmins);

api.get("/admin/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], AdminController.getAdmin);

api.patch("/admin/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateAdmin, validate], AdminController.updateAdmin);

api.delete("/admin/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], AdminController.deleteAdmin);

module.exports = api;