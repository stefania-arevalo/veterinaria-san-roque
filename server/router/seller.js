const express = require("express");
const SellerController = require("../controllers/seller");
const md_auth = require("../middlewares/authenticated");
const { validateCreateSeller, validateId } = require("../validators/seller");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/seller", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateSeller, validate], SellerController.createSeller);

api.get("/sellers", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], SellerController.getSellers);

api.get("/seller/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], SellerController.getSeller);

api.delete("/seller/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], SellerController.deleteSeller);

module.exports = api;