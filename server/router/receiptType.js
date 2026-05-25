const express = require("express");
const ReceiptTypeController = require("../controllers/receiptType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/receiptType");

const api = express.Router();

api.post("/receipt-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ReceiptTypeController.createReceiptType);
api.patch("/receipt-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], ReceiptTypeController.updateReceiptType);
api.delete("/receipt-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ReceiptTypeController.deleteReceiptType);

api.get("/receipt-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], ReceiptTypeController.getAllReceiptTypes);
api.get("/receipt-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], ReceiptTypeController.getReceiptType);

module.exports = api;