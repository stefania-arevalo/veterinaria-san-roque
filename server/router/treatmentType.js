const express = require("express");
const TreatmentTypeController = require("../controllers/treatmentType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/treatmentType");

const api = express.Router();

api.post("/treatment-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], TreatmentTypeController.createTreatmentType);
api.get("/treatment-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], TreatmentTypeController.getTreatmentTypes);
api.get("/treatment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], TreatmentTypeController.getTreatmentType);
api.patch("/treatment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], TreatmentTypeController.updateTreatmentType);
api.delete("/treatment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], TreatmentTypeController.deleteTreatmentType);

module.exports = api;