const express = require("express");
const CategoryController = require("../controllers/category");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/category");

const api = express.Router();

api.post("/category", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], CategoryController.createCategory);
api.get("/categories", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], CategoryController.getCategories);
api.get("/category/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], CategoryController.getCategory);
api.patch("/category/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], CategoryController.updateCategory);
api.delete("/category/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], CategoryController.deleteCategory);

module.exports = api;