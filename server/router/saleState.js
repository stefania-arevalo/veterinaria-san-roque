const express = require("express");
const SaleStateController = require("../controllers/saleState");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/saleState");

const api = express.Router();

api.post("/sale-state", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], SaleStateController.createSaleState);
api.patch("/sale-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], SaleStateController.updateSaleState);
api.delete("/sale-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], SaleStateController.deleteSaleState);

api.get("/sale-states", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], SaleStateController.getAllSaleStates);
api.get("/sale-state/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], SaleStateController.getSaleState);

module.exports = api;