const { body, param } = require("express-validator");
const Staff = require("../models/staff");

const validateCreateAdmin = [
  body("idPersonal")
    .notEmpty().withMessage("El ID de personal es obligatorio.")
    .isInt().withMessage("El ID de personal debe ser un número entero.")
    .custom(async (value) => {
        const staff = await Staff.findByPk(value);
        if (!staff) throw new Error("El personal seleccionado no existe.");
        return true;
    }),
  body("areaResponsabilidad")
    .notEmpty().withMessage("El área de responsabilidad es obligatoria.")
    .isLength({ min: 3, max: 100 }).withMessage("El área debe tener entre 3 y 100 caracteres.")
];

const validateUpdateAdmin = [
  body("areaResponsabilidad")
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage("El área debe tener entre 3 y 100 caracteres.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateAdmin, validateUpdateAdmin, validateId };