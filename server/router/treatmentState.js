const express = require("express");
const TreatmentStateController = require("../controllers/treatmentState");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/treatmentState");

const api = express.Router();

api.post("/treatment-state", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], TreatmentStateController.createTreatmentState);
api.get("/treatment-states", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], TreatmentStateController.getTreatmentStates);
api.get("/treatment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], TreatmentStateController.getTreatmentState);
api.patch("/treatment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], TreatmentStateController.updateTreatmentState);
api.delete("/treatment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], TreatmentStateController.deleteTreatmentState);

module.exports = api;