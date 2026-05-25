const express = require("express");
const PaymentTypeController = require("../controllers/paymentType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/paymentType");

const api = express.Router();

api.post("/payment-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], PaymentTypeController.createPaymentType);
api.patch("/payment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], PaymentTypeController.updatePaymentType);
api.delete("/payment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], PaymentTypeController.deletePaymentType);

api.get("/payment-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], PaymentTypeController.getAllPaymentTypes);
api.get("/payment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], PaymentTypeController.getPaymentType);

module.exports = api;