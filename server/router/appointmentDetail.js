const express = require("express");
const AppointmentDetailController = require("../controllers/appointmentDetail");
const md_auth = require("../middlewares/authenticated");
const { validateCreateAppointmentDetail, validateUpdateAppointmentDetail, validateId } = require("../validators/appointmentDetail");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/appointment-detail",                 [md_auth.asureAuth, md_auth.hasRole([1,2,3]),   validateCreateAppointmentDetail,   validate], AppointmentDetailController.createAppointmentDetail);
api.get("/appointment-details/cita/:idCita",    [md_auth.asureAuth, md_auth.hasRole([1,2,3,4,5])],                                            AppointmentDetailController.getAppointmentDetailsByCita);
api.patch("/appointment-detail/:idDetalle/complete", [md_auth.asureAuth, md_auth.hasRole([1,2,3, 4])],  AppointmentDetailController.completeService)
api.get("/appointment-detail/:id",              [md_auth.asureAuth, md_auth.hasRole([1,2,3,4,5]), validateId,                       validate], AppointmentDetailController.getAppointmentDetail);
api.patch("/appointment-detail/:id",            [md_auth.asureAuth, md_auth.hasRole([1,2,3]),   validateUpdateAppointmentDetail,   validate], AppointmentDetailController.updateAppointmentDetail);
api.delete("/appointment-detail/:id",           [md_auth.asureAuth, md_auth.hasRole([1]),         validateId,                       validate], AppointmentDetailController.deleteAppointmentDetail);
api.post("/appointment-detail/:id/reschedule", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3])], AppointmentDetailController.rescheduleService);
api.patch("/appointment-detail/:id/vincular-reagenda", [md_auth.asureAuth, md_auth.hasRole([1,2,3])], AppointmentDetailController.vincularReagenda);

module.exports = api;