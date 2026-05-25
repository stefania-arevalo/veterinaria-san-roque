const express = require("express");
const VetScheduleController = require("../controllers/vetSchedule");
const md_auth = require("../middlewares/authenticated");
const api = express.Router();

// Admin(1): C,R,U,D | Vet(2): R, U(own) | Asistente(3): R | Vendedor(4): R | Cliente(5): -
api.post("/vetschedule", [md_auth.asureAuth, md_auth.hasRole([1])], VetScheduleController.createVetSchedule);
api.get("/vetschedules", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], VetScheduleController.getVetSchedules);
api.get("/vetschedule/:idVeterinario/:idHorario", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], VetScheduleController.getVetSchedule);
api.delete("/vetschedule/:idVeterinario/:idHorario", [md_auth.asureAuth, md_auth.hasRole([1])], VetScheduleController.deleteVetSchedule);

module.exports = api;