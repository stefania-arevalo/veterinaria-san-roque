const { body, param } = require("express-validator"); // <-- Agregado 'param' aquí

const validateCreateAnimalSize = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 2, max: 20 }).withMessage("Debe tener entre 2 y 20 caracteres.")
];

const validateUpdateAnimalSize = [
    body("descripcion")
        .optional() // Usar optional en update es mejor práctica
        .isLength({ min: 2, max: 20 }).withMessage("Debe tener entre 2 y 20 caracteres.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateAnimalSize, validateUpdateAnimalSize, validateId };