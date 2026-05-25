const express = require("express");
const LocalityController = require("../controllers/locality");
const md_auth = require("../middlewares/authenticated");
// Importamos los validadores y tu middleware de validación
const { validateCreateLocality, validateUpdateLocality, validateId } = require("../validators/locality");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/locality", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateLocality, validate], LocalityController.createLocality);

api.get("/localities", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], LocalityController.getLocalities);

api.patch("/locality/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdateLocality, validate], LocalityController.updateLocality);

api.delete("/locality/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], LocalityController.deleteLocality);

module.exports = api;