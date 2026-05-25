const express = require("express");
const TreatmentController = require("../controllers/treatment");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate"); // Tu middleware global de validación
const { validateCreate, validateUpdate, validateId } = require("../validators/treatment");

const api = express.Router();

api.post("/treatment", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateCreate, validate], TreatmentController.createTreatment);
api.patch("/treatment/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdate, validate], TreatmentController.updateTreatment);
api.delete("/treatment/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validate], TreatmentController.deleteTreatment);

api.get("/treatments", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], TreatmentController.getAllTreatments);
api.get("/treatment/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], TreatmentController.getTreatment);

module.exports = api;