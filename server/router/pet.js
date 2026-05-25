const express = require("express");
const PetCtrl = require("../controllers/pet");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreatePet, validateUpdatePet, validateId } = require("../validators/pet");

const api = express.Router();

api.post("/pet", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3]), validateCreatePet, validate], PetCtrl.createPet);
api.get("/pets", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], PetCtrl.getPets);
api.get("/pet/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], PetCtrl.getPet);
api.patch("/pet/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 5]), validateId, validateUpdatePet, validate], PetCtrl.updatePet);
api.delete("/pet/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], PetCtrl.deletePet);

module.exports = api;