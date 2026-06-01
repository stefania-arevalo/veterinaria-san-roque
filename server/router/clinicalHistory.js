const express = require("express");
const ClinicalHistoryController = require("../controllers/clinicalHistory");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/clinicalHistory");

const api = express.Router();

// Crear, editar y borrar: Solo Admin (1) y Veterinario (2)
api.post("/clinical-history", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateCreate, validate], ClinicalHistoryController.createHistory);
api.patch("/clinical-history/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdate, validate], ClinicalHistoryController.updateHistory);
api.delete("/clinical-history/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validate], ClinicalHistoryController.deleteHistory);
api.get("/clinical-histories", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ClinicalHistoryController.getAllHistories);

// VER UN HISTORIAL INDIVIDUAL: Admin (1) y Veterinario (2) seguro. 
// (Nota: Si un cliente (5) o asistente (3) necesita ver el de una mascota específica por una consulta, podrías evaluarlo, pero para máxima seguridad de historiales médicos, dejá solo 1 y 2)
api.get("/clinical-history/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validate], ClinicalHistoryController.getHistory);

module.exports = api;