const { body, param } = require("express-validator");

const validateCreateSpecies = [
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio.")
        .isLength({ min: 2, max: 255 }).withMessage("El nombre debe tener entre 2 y 255 caracteres.")
];

const validateUpdateSpecies = [
    body("nombre")
        .optional()
        .isLength({ min: 2, max: 255 }).withMessage("El nombre debe tener entre 2 y 255 caracteres.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateSpecies, validateUpdateSpecies, validateId };