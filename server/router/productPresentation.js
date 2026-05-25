const express = require("express");
const ProductPresentationController = require("../controllers/productPresentation");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/productPresentation");

const api = express.Router();

api.post("/prod-pres", [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]), validateCreate, validate], ProductPresentationController.createProdPres);
api.patch("/prod-pres/:id", [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]), validateId, validateUpdate, validate], ProductPresentationController.updateProdPres);
api.delete("/prod-pres/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ProductPresentationController.deleteProdPres);
api.get("/prod-pres/product/:idProducto", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ProductPresentationController.getProdPresByProduct);
api.get("/prod-pres", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ProductPresentationController.getAllProdPres);
api.get("/prod-pres/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ProductPresentationController.getProdPres);

module.exports = api;