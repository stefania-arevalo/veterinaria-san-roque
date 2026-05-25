const { body, param } = require("express-validator");
const Staff = require("../models/staff");

const validateCreateSeller = [
  body("idPersonal")
    .notEmpty().withMessage("El ID de personal es obligatorio.")
    .isInt().withMessage("El ID de personal debe ser un número entero.")
    .custom(async (value) => {
        const staff = await Staff.findByPk(value);
        if (!staff) throw new Error("El personal seleccionado no existe.");
        return true;
    })
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateSeller, validateId };