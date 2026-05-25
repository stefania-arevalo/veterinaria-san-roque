const express = require("express");
const PresentationController = require("../controllers/presentation");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/presentation");

const api = express.Router();

api.post("/presentation", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], PresentationController.createPresentation);
api.get("/presentations", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], PresentationController.getPresentations);
api.get("/presentation/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], PresentationController.getPresentation);
api.patch("/presentation/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], PresentationController.updatePresentation);
api.delete("/presentation/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], PresentationController.deletePresentation);

module.exports = api;