const express = require("express");
const BreedController = require("../controllers/breed");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreateBreed, validateUpdateBreed, validateId } = require("../validators/breed");

const api = express.Router();

api.post("/breed", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateBreed, validate], BreedController.createBreed);

api.get("/breeds", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validate], BreedController.getBreeds);

api.get("/breed/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], BreedController.getBreed);

api.patch("/breed/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateBreed, validate], BreedController.updateBreed);

api.delete("/breed/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], BreedController.deleteBreed);

module.exports = api;