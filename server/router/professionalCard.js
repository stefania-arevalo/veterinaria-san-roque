const express = require("express");
const CardController = require("../controllers/professionalCard");
const md_auth = require("../middlewares/authenticated");
const { validateCreateCard, validateUpdateCard, validateId } = require("../validators/professionalCard");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/card", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateCard, validate], CardController.createCard);

api.get("/cards", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3])], CardController.getCards);

api.patch("/card/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2]), validateId, validateUpdateCard, validate], CardController.updateCard);

api.delete("/card/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], CardController.deleteCard);

module.exports = api;