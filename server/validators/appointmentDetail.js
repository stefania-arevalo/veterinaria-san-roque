const { body, param } = require("express-validator");
const Appointment = require("../models/appointment");
const ServicePrice = require("../models/servicePrice"); 
const Staff = require("../models/staff"); 
const ServiceStatus = require("../models/serviceAppointmentState"); 

const validateCreateAppointmentDetail = [
  body("idCita")
    .notEmpty().withMessage("El ID de cita es obligatorio.")
    .isInt({ min: 1 }).withMessage("El ID de cita debe ser un número entero válido.")
    .custom(async (value) => {
      const appointment = await Appointment.findByPk(value);
      if (!appointment) throw new Error("La cita con ID " + value + " no existe.");
      return true;
    }),

  body("idPrecioServicio")
    .notEmpty().withMessage("El ID de precio de servicio es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const service = await ServicePrice.findByPk(value);
      if (!service) throw new Error("El precio servicio seleccionado no existe.");
      return true;
    }),

  body("idEstadoServicio")
    .optional()
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      if (!value) return true;
      const status = await ServiceStatus.findByPk(value);
      if (!status) throw new Error("El estado de servicio no es válido.");
      return true;
    }),

  body("observaciones")
    .optional()
    .isLength({ max: 255 }).withMessage("Las observaciones no pueden superar los 255 caracteres."),
];

const validateUpdateAppointmentDetail = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),

  body("idEstadoServicio")
    .optional()
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      if (!value) return true;
      const status = await ServiceStatus.findByPk(value);
      if (!status) throw new Error("El estado de servicio no es válido.");
      return true;
    }),

  body("observaciones")
    .optional()
    .isLength({ max: 255 }).withMessage("Las observaciones no pueden superar los 255 caracteres."),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreateAppointmentDetail, validateUpdateAppointmentDetail, validateId };