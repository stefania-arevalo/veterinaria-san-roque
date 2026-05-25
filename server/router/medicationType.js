const express = require("express");
const MedicationTypeController = require("../controllers/medicationType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/medicationType");

const api = express.Router();

api.post("/medication-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], MedicationTypeController.createMedicationType);
api.get("/medication-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], MedicationTypeController.getMedicationTypes);
api.get("/medication-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], MedicationTypeController.getMedicationType);
api.patch("/medication-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], MedicationTypeController.updateMedicationType);
api.delete("/medication-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], MedicationTypeController.deleteMedicationType);

module.exports = api;