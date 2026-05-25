const express = require("express");
const ScheduleController = require("../controllers/schedule");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validateCreateSchedule, validateUpdateSchedule, validateId } = require("../validators/schedule");

const api = express.Router();

api.post("/schedule", [md_auth.asureAuth, md_auth.hasRole([1]), validateCreateSchedule, validate], ScheduleController.createSchedule);
api.get("/schedules", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], ScheduleController.getSchedules);
api.get("/schedule/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5]), validateId, validate], ScheduleController.getSchedule);
api.patch("/schedule/:id", [md_auth.asureAuth, md_auth.hasRole([1, 3]), validateId, validateUpdateSchedule, validate], ScheduleController.updateSchedule);
api.delete("/schedule/:id", [md_auth.asureAuth, md_auth.hasRole([1]), validateId, validate], ScheduleController.deleteSchedule);

module.exports = api;