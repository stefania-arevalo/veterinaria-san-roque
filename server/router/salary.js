const express = require("express");
const SalaryController = require("../controllers/salary");
const md_auth = require("../middlewares/authenticated");
const { validateCreateSalary, validateUpdateSalary, validateId } = require("../validators/salary");
const validate = require("../middlewares/validate"); // Tu middleware existente

const api = express.Router();

api.post("/salary", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateSalary, validate], SalaryController.createSalary);

api.get("/salaries", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], SalaryController.getSalaries);

api.patch("/salary/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateSalary, validate], SalaryController.updateSalary);

api.delete("/salary/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], SalaryController.deleteSalary);

module.exports = api;