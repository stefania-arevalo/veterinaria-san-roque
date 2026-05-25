const { body, param } = require("express-validator");
const Pet = require("../models/pet");
const AppointmentType = require("../models/appointmentType");
const AppointmentState = require("../models/appointmentState");
const Staff = require("../models/staff");

const validateCreateAppointment = [
  body("fecha")
  .notEmpty().withMessage("La fecha es obligatoria.")
  .isDate().withMessage("El formato de fecha no es válido.")
  .custom((value) => {
    // Comparar solo strings YYYY-MM-DD para evitar problema de timezone
    const hoy = new Date().toLocaleDateString('en-CA'); // "2026-05-04"
    if (value < hoy) {
        throw new Error("La fecha no puede ser anterior al día de hoy.");
    }
    return true;
  }),

  body("hora")
    .notEmpty().withMessage("La hora es obligatoria.")
    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage("Formato HH:MM."),
  
  body("idMascota")
    .notEmpty().withMessage("La mascota es obligatoria.")
    .isInt({ min: 1 }).withMessage("El ID de mascota debe ser un número entero válido.")
    .custom(async (value) => {
      const pet = await Pet.findByPk(value);
      if (!pet) throw new Error("La mascota seleccionada no existe.");
      return true;
    }),

  body("idTipoCita")
    .notEmpty().withMessage("El tipo de cita es obligatorio.")
    .isInt({ min: 1 }).withMessage("El ID de tipo de cita debe ser un número entero válido.")
    .custom(async (value) => {
      const type = await AppointmentType.findByPk(value);
      if (!type) throw new Error("El tipo de cita seleccionado no existe.");
      return true;
    }),

  body("idEstadoCita")
    .optional()
    .isInt({ min: 1 }).withMessage("El ID de estado de cita debe ser un número entero válido.")
    .custom(async (value) => {
      const state = await AppointmentState.findByPk(value);
      if (!state) throw new Error("El estado de cita seleccionado no existe.");
      return true;
    }),

  body("idVeterinario")
    .notEmpty().withMessage("El veterinario es obligatorio.")
    .isInt({ min: 1 }).withMessage("El ID de veterinario debe ser un número entero válido.")
    .custom(async (value) => {
      const staff = await Staff.findByPk(value);
      if (!staff) throw new Error("El veterinario seleccionado no existe.");
      return true;
    }),

  body("servicios")
    .optional()
    .isArray().withMessage("Los servicios deben ser un array."),

  body("servicios.*.idPrecioServicio")
    .notEmpty().withMessage("Cada servicio debe tener un idPrecioServicio.")
    .isInt({ min: 1 }).withMessage("El idPrecioServicio debe ser un número entero válido."),

  body("servicios.*.idPersonalRealiza")
    .optional()
    .isInt({ min: 1 }).withMessage("El idPersonalRealiza debe ser un número entero válido."),
];

const validateUpdateAppointment = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID de la cita debe ser un número entero válido."),

  body("fecha")
    .optional()
    .isDate()
    .custom((value, { req }) => {
      const fechaCita = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      return true; 
    }),
    
  body("hora")
    .optional()
    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/),
    
  body("idVeterinario")
    .optional()
    .isInt({ min: 1 }).withMessage("El ID de veterinario debe ser un número entero válido.")
    .custom(async (value) => {
        if (!value) return true; // Si es opcional y no viene, ignoramos
        const staff = await Staff.findByPk(value);
        if (!staff) throw new Error("El veterinario seleccionado no existe.");
        return true;
    }),

  body("idEstadoCita")
    .optional()
    .isInt({ min: 1 }).withMessage("El ID de estado de cita debe ser un número entero válido.")
    .custom(async (value) => {
        if (!value) return true;
        const state = await AppointmentState.findByPk(value);
        if (!state) throw new Error("El estado de cita seleccionado no existe.");
        return true;
    }),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreateAppointment, validateUpdateAppointment, validateId };