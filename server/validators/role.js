const { body, param } = require("express-validator");

const validateCreateRole = [
  body("descripcion")
    .notEmpty().withMessage("La descripción es obligatoria.")
    .isLength({ min: 2, max: 50 }).withMessage("Debe tener entre 2 y 50 caracteres.")
];

const validateUpdateRole = [
    body("descripcion")
      .notEmpty().withMessage("La descripción es obligatoria.")
      .isLength({ min: 2, max: 50 }).withMessage("Debe tener entre 2 y 50 caracteres.")
  ];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateRole, validateUpdateRole, validateId };