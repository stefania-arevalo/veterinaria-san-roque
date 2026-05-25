const express = require("express");
const ServiceController = require("../controllers/service");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/service");

const api = express.Router();

api.post("/service", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ServiceController.createService);
api.get("/services", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ServiceController.getServices);
api.get("/service/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ServiceController.getService);
api.patch("/service/:id", [md_auth.asureAuth, md_auth.hasRole([1, 3]), validateId, validateUpdate, validate], ServiceController.updateService);
api.delete("/service/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ServiceController.deleteService);

module.exports = api;