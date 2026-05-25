const express = require("express");
const StaffController = require("../controllers/staff");
const md_auth = require("../middlewares/authenticated");
const { validateCreateStaff, validateUpdateStaff, validateId } = require("../validators/staff");
const validate = require("../middlewares/validate"); // Tu middleware existente

const api = express.Router();

api.post("/staff", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateStaff, validate], StaffController.createStaff);

api.get("/staffs", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], StaffController.getStaffs);

api.get("/staff/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], StaffController.getStaff);

api.patch("/staff/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validateUpdateStaff, validate], StaffController.updateStaff);

api.delete("/staff/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], StaffController.deleteStaff);

module.exports = api;