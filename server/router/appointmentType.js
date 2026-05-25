const express = require("express");
const AppTypeController = require("../controllers/appointmentType");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/appointmentType");

const api = express.Router();

api.post("/appointment-type", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], AppTypeController.createAppointmentType);
api.get("/appointment-types", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], AppTypeController.getAppointmentTypes);
api.get("/appointment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], AppTypeController.getAppointmentType);
api.patch("/appointment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], AppTypeController.updateAppointmentType);
api.delete("/appointment-type/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], AppTypeController.deleteAppointmentType);
module.exports = api;