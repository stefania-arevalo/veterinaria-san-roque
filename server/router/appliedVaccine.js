const express = require("express");
const AppliedVaccineController = require("../controllers/appliedVaccine");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/appliedVaccine");

const api = express.Router();

api.post("/applied-vaccine", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateCreate, validate], AppliedVaccineController.createAppliedVaccine);
api.patch("/applied-vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdate, validate], AppliedVaccineController.updateApplied);
api.delete("/applied-vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validate], AppliedVaccineController.deleteApplied);

api.get("/applied-vaccines", [md_auth.asureAuth, md_auth.hasRole([1, 2, 4, 5])], AppliedVaccineController.getAllApplied);
api.get("/applied-vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 4, 5]), validateId, validate], AppliedVaccineController.getAppliedById);
api.get("/applied-vaccines/mascota/:idMascota", [md_auth.asureAuth], AppliedVaccineController.getUncollectedByPet);
api.get("/applied-vaccines/por-lote/:idLote", [md_auth.asureAuth, md_auth.hasRole([1, 2, 4, 5])], AppliedVaccineController.getAppliedByLote);

module.exports = api;