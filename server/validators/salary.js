const { body, param } = require("express-validator");
const Staff = require("../models/staff");

const validateCreateSalary = [
  body("fechaLiquidacion")
    .notEmpty().withMessage("La fecha es obligatoria.")
    .isDate().withMessage("Formato de fecha inválido (YYYY-MM-DD)."),
  body("horasTrabajadas")
    .notEmpty().withMessage("Las horas son obligatorias.")
    .isInt({ min: 0 }).withMessage("Las horas deben ser un número entero positivo."),
  body("tarifaHora")
    .notEmpty().withMessage("La tarifa es obligatoria.")
    .isFloat({ min: 0.01 }).withMessage("La tarifa debe ser mayor a 0."),
  body("idPersonal")
    .optional()
    .isInt().withMessage("El idPersonal debe ser un entero.")
    .custom(async (value) => {
      const exists = await Staff.findByPk(value);
      if (!exists) throw new Error("El personal seleccionado no existe.");
      return true;
    }),
];

const validateUpdateSalary = [
  body("tarifaHora")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("La tarifa debe ser mayor a 0."),
  body("horasTrabajadas")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Las horas deben ser un entero no negativo."),
  body("idPersonal")
      .not().exists()
      .withMessage("No se puede cambiar el empleado de una liquidación existente."),
  body("fechaLiquidacion")
      .not().exists()
      .withMessage("No se puede cambiar el período de una liquidación existente."),
];

module.exports = { validateCreateSalary, validateUpdateSalary, validateId };