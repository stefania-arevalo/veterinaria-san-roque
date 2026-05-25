const express = require("express");
const VaccineController = require("../controllers/vaccine");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/vaccine");

const api = express.Router();

api.post("/vaccine", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], VaccineController.createVaccine);
api.patch("/vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], VaccineController.updateVaccine);
api.delete("/vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], VaccineController.deleteVaccine);
api.get("/vaccine/product/:idProducto", [md_auth.asureAuth], VaccineController.getVaccineByProduct);
api.get("/vaccines", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3])], VaccineController.getVaccines);
api.get("/vaccine/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3]), validateId, validate], VaccineController.getVaccine);

module.exports = api;