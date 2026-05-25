const express = require("express");
const BatchController = require("../controllers/batch");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/batch");

const api = express.Router();

api.post("/batch", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], BatchController.createBatch);
api.patch("/batch/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], BatchController.updateBatch);
api.delete("/batch/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], BatchController.deleteBatch);

api.get("/batches", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], BatchController.getBatches);
api.get("/batch/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], BatchController.getBatch);

api.get("/batches/product/:idProducto", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], BatchController.getBatchesByProduct);

module.exports = api;