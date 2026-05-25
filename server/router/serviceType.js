const express = require("express");
const ServiceTypeController = require("../controllers/serviceType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/serviceType");

const api = express.Router();

api.post("/service-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ServiceTypeController.createServiceType);
api.get("/service-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ServiceTypeController.getServiceTypes);
api.get("/service-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ServiceTypeController.getServiceType);
api.patch("/service-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], ServiceTypeController.updateServiceType);
api.delete("/service-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ServiceTypeController.deleteServiceType);

module.exports = api;