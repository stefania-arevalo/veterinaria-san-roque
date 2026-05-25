const express = require("express");
const MedicationController = require("../controllers/medication");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/medication");

const api = express.Router();

api.post("/medication", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], MedicationController.createMedication);
api.patch("/medication/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], MedicationController.updateMedication);
api.delete("/medication/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], MedicationController.deleteMedication);

api.get("/medications", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3])], MedicationController.getMedications);
api.get("/medication/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3]), validateId, validate], MedicationController.getMedication);

module.exports = api;