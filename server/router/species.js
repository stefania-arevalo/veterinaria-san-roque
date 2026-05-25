const express = require("express");
const SpeciesController = require("../controllers/species");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreateSpecies, validateUpdateSpecies, validateId } = require("../validators/species");

const api = express.Router();

api.post("/species", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateSpecies, validate], SpeciesController.createSpecies);

api.get("/species", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], SpeciesController.getSpecies);

api.get("/species/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], SpeciesController.getOneSpecies);

api.patch("/species/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateSpecies, validate], SpeciesController.updateSpecies);

api.delete("/species/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], SpeciesController.deleteSpecies);

module.exports = api;