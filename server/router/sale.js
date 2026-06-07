const express = require("express");
const SaleController = require("../controllers/sale");
const md_auth = require("../middlewares/authenticated");
const { validateCreateSale, validateUpdateSale, validateId } = require("../validators/sale");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/sale",       [md_auth.asureAuth, md_auth.hasRole([1,4]),   validateCreateSale,  validate], SaleController.createSale);
api.get("/sales",       [md_auth.asureAuth, md_auth.hasRole([1,2,3,4])],                                SaleController.getAllSales);
api.get("/sale/:id",    [md_auth.asureAuth, md_auth.hasRole([1,2,3,4]), validateId,           validate], SaleController.getSale);
api.patch("/sale/:id",  [md_auth.asureAuth, md_auth.hasRole([1,3,4]), validateUpdateSale,   validate], SaleController.updateSale);
api.delete("/sale/:id", [md_auth.asureAuth, md_auth.hasRole([1]),      validateId,           validate], SaleController.deleteSale);
api.get("/my-sales", [md_auth.asureAuth, md_auth.hasRole([5])], SaleController.getMySales);

module.exports = api;