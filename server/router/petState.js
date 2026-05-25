const express = require("express");
const PetStateController = require("../controllers/petState");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/petState");

const api = express.Router();

api.post("/pet-state", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], PetStateController.createPetState);
api.get("/pet-states", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], PetStateController.getPetStates);
api.get("/pet-state/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], PetStateController.getPetState);
api.patch("/pet-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], PetStateController.updatePetState);
api.delete("/pet-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], PetStateController.deletePetState);

module.exports = api;