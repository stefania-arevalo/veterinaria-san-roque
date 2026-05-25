const express = require("express");
const ClientController = require("../controllers/client");
const md_auth = require("../middlewares/authenticated");
const { validateCreateClient, validateUpdateClient, validateId } = require("../validators/client");
const validate = require("../middlewares/validate");

const api = express.Router();

// CREATE
api.post("/client", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateCreateClient, validate], ClientController.createClient);

// GET ALL
api.get("/clients", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], ClientController.getClients);

// GET ONE
api.get("/client/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ClientController.getClient);

// UPDATE
api.patch("/client/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validateUpdateClient, validate], ClientController.updateClient);

// DELETE
api.delete("/client/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ClientController.deleteClient);

module.exports = api;