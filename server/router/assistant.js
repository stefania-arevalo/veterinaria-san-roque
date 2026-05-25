const express = require("express");
const AssistantController = require("../controllers/assistant");
const md_auth = require("../middlewares/authenticated");
const { validateCreateAssistant, validateUpdateAssistant, validateId } = require("../validators/assistant");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/assistant", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateAssistant, validate], AssistantController.createAssistant);

api.get("/assistants", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], AssistantController.getAssistants);

api.get("/assistant/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4]), validateId, validate], AssistantController.getAssistant);

api.patch("/assistant/:id", [md_auth.asureAuth, md_auth.hasRole([1, 3]), validateId, validateUpdateAssistant, validate], AssistantController.updateAssistant);

api.delete("/assistant/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], AssistantController.deleteAssistant);

module.exports = api;