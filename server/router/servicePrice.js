const express = require("express");
const ServicePriceController = require("../controllers/servicePrice");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/servicePrice");

const api = express.Router();

api.post("/service-price", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ServicePriceController.createServicePrice);
api.get("/service-prices", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ServicePriceController.getServicePrices);
api.get("/service-price/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ServicePriceController.getServicePrice);
api.patch("/service-price/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], ServicePriceController.updateServicePrice);
api.delete("/service-price/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ServicePriceController.deleteServicePrice);

module.exports = api;