const express = require("express");
const ServiceAppointmentStateController = require("../controllers/serviceAppointmentState");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreate, validateUpdate, validateId } = require("../validators/serviceAppointmentState");

const api = express.Router();

api.post("/service-appointment-state", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreate, validate], ServiceAppointmentStateController.createServiceAppointmentState);
api.get("/service-appointment-states", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ServiceAppointmentStateController.getServiceAppointmentStates);
api.get("/service-appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ServiceAppointmentStateController.getServiceAppointmentState);
api.patch("/service-appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validateUpdate, validate], ServiceAppointmentStateController.updateServiceAppointmentState);
api.delete("/service-appointment-state/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ServiceAppointmentStateController.deleteServiceAppointmentState);

module.exports = api;