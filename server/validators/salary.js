const { body, param } = require("express-validator");
const User = require("../models/user");

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
  body("idUsuario")
    .notEmpty().withMessage("El idUsuario es obligatorio.")
    .isInt().withMessage("El idUsuario debe ser un número entero.")
    .custom(async (value) => {
        const exists = await User.findByPk(value);
        if (!exists) throw new Error("El usuario seleccionado no existe.");
        return true;
      }),
];

const validateUpdateSalary = [
  body("fechaLiquidacion")
    .optional()
    .isDate().withMessage("Formato de fecha inválido."),
  body("horasTrabajadas")
    .optional()
    .isInt({ min: 0 }).withMessage("Las horas deben ser un número entero positivo."),
  body("tarifaHora")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("La tarifa debe ser mayor a 0.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateSalary, validateUpdateSalary, validateId };