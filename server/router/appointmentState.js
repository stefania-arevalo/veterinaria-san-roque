const express = require("express");
const AppStateController = require("../controllers/appointmentState");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/appointmentState");

const api = express.Router();

api.post("/appointment-state", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], AppStateController.createAppointmentState);
api.get("/appointment-states", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], AppStateController.getAppointmentStates);
api.get("/appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], AppStateController.getAppointmentState);
api.patch("/appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], AppStateController.updateAppointmentState);
api.delete("/appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], AppStateController.deleteAppointmentState);

module.exports = api;