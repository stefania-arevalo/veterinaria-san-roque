const express = require("express");
const VetController = require("../controllers/veterinarian");
const md_auth = require("../middlewares/authenticated");
const { validateCreateVet, validateUpdateVet, validateId } = require("../validators/veterinarian");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/veterinarian", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateVet, validate], VetController.createVeterinarian);
api.get("/veterinarians", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], VetController.getVeterinarians);
api.get("/veterinarian/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], VetController.getVeterinarian);
api.patch("/veterinarian/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdateVet, validate], VetController.updateVeterinarian);
api.delete("/veterinarian/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], VetController.deleteVeterinarian);

module.exports = api;