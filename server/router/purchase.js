const express = require("express");
const PurchaseController = require("../controllers/purchase");
const md_auth = require("../middlewares/authenticated");
const { validateCreatePurchase, validateUpdatePurchase, validateId } = require("../validators/purchase");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/purchase",       [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateCreatePurchase,   validate], PurchaseController.createPurchase);
api.get("/purchases",       [md_auth.asureAuth, md_auth.hasRole([1, 3, 4])],                                     PurchaseController.getAllPurchases);
api.get("/purchase/:id",    [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateId,               validate], PurchaseController.getPurchase);
api.patch("/purchase/:id",  [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateUpdatePurchase,   validate], PurchaseController.updatePurchase);
api.delete("/purchase/:id", [md_auth.asureAuth, md_auth.hasRole([1]),        validateId,               validate], PurchaseController.deletePurchase);

module.exports = api;