const express = require("express");
const ProductController = require("../controllers/product");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/product");

const api = express.Router();

api.post("/product", [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]), validateCreate, validate], ProductController.createProduct);
api.patch("/product/:id", [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]), validateId, validateUpdate, validate], ProductController.updateProduct);
api.delete("/product/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ProductController.deleteProduct);

api.get("/products", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], ProductController.getProducts);
api.get("/product/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], ProductController.getProduct);

module.exports = api;