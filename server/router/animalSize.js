const express = require("express");
const AnimalSizeController = require("../controllers/animalSize");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreateAnimalSize, validateUpdateAnimalSize, validateId } = require("../validators/animalSize");

const api = express.Router();

api.post("/animal-size", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateAnimalSize, validate], AnimalSizeController.createAnimalSize);

api.get("/animal-sizes", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], AnimalSizeController.getAnimalSizes);

api.get("/animal-size/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], AnimalSizeController.getAnimalSize);

api.patch("/animal-size/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateAnimalSize, validate], AnimalSizeController.updateAnimalSize);

api.delete("/animal-size/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], AnimalSizeController.deleteAnimalSize);

module.exports = api;