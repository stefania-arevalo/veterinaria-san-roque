const express = require("express");
const TreatmentMedController = require("../controllers/treatmentMedication");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate"); // Tu middleware global
const { validateCreate, validateUpdate, validateId } = require("../validators/treatmentMedication");

const api = express.Router();

api.post("/treatment-med", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateCreate, validate], TreatmentMedController.createTreatmentMed);
api.patch("/treatment-med/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdate, validate], TreatmentMedController.updateTreatmentMed);
api.delete("/treatment-med/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validate], TreatmentMedController.deleteTreatmentMed);

api.get("/treatment-meds/:idTratamiento", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], TreatmentMedController.getMedsByTreatment);
api.get("/treatment-med/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], TreatmentMedController.getTreatmentMed);

module.exports = api;