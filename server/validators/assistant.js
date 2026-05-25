const { body, param } = require("express-validator");
const Staff = require("../models/staff");

const validateCreateAssistant = [
  body("idPersonal")
    .notEmpty().withMessage("El ID de personal es obligatorio.")
    .isInt().withMessage("El ID de personal debe ser un número entero.")
    .custom(async (value) => {
        const staff = await Staff.findByPk(value);
        if (!staff) throw new Error("El personal seleccionado no existe.");
        return true;
    }),
  body("certificados")
    .optional()
    .isLength({ max: 255 }).withMessage("El campo certificados excede el límite de 255 caracteres.")
];

const validateUpdateAssistant = [
  body("certificados")
    .optional()
    .isLength({ max: 255 }).withMessage("El campo certificados excede el límite de 255 caracteres.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateAssistant, validateUpdateAssistant, validateId };