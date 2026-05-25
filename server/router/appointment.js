const express = require("express");
const AppointmentController = require("../controllers/appointment");
const md_auth = require("../middlewares/authenticated");
const { validateCreateAppointment, validateUpdateAppointment, validateId } = require("../validators/appointment");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/appointment",                  [md_auth.asureAuth, md_auth.hasRole([1,2,3,4]),   validateCreateAppointment, validate], AppointmentController.createAppointment);
api.get("/appointments",                  [md_auth.asureAuth, md_auth.hasRole([1,2,3,4,5])],                                     AppointmentController.getAppointments);
api.get("/appointments/staff/:idStaff",   [md_auth.asureAuth, md_auth.hasRole([1,2,3,4])],                                      AppointmentController.getAppointmentsByStaff);
api.get("/appointments/availability",   [md_auth.asureAuth, md_auth.hasRole([1,2,3,4])],                                      AppointmentController.getAvailability);
api.get("/appointment/:id",               [md_auth.asureAuth, md_auth.hasRole([1,2,3,4,5]), validateId,                validate], AppointmentController.getAppointment);
api.patch("/appointment/:id/status", [md_auth.asureAuth, md_auth.hasRole([1,2,3,4])], AppointmentController.updateStatus)
api.patch("/appointment/:id",             [md_auth.asureAuth, md_auth.hasRole([1,2,3]),      validateUpdateAppointment, validate], AppointmentController.updateAppointment);
api.delete("/appointment/:id",            [md_auth.asureAuth, md_auth.hasRole([1, 3]),           validateId,                validate], AppointmentController.cancelAppointment);
api.patch("/appointment/:id/confirm", [md_auth.asureAuth, md_auth.hasRole([1,2,3,4])], AppointmentController.confirmAppointment);

module.exports = api;