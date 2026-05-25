const express = require("express");
const ProviderController = require("../controllers/provider");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/provider");

const api = express.Router();

api.post("/provider", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ProviderController.createProvider);
api.get("/providers", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], ProviderController.getProviders);
api.get("/provider/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], ProviderController.getProvider);
api.patch("/provider/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], ProviderController.updateProvider);
api.delete("/provider/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ProviderController.deleteProvider);

module.exports = api;