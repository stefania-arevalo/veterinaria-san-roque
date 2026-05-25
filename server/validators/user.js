const { body, param } = require("express-validator");
const Role = require("../models/role");

const validateCreateUser = [
  body("usuario")
    .notEmpty().withMessage("El usuario es obligatorio.")
    .isLength({ min: 3, max: 50 }).withMessage("El usuario debe tener entre 3 y 50 caracteres."),
  body("contraseña")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
  body("idRol")
    .notEmpty().withMessage("El rol es obligatorio.")
    .isInt().withMessage("El ID de rol debe ser un número entero.")
    .custom(async (value) => {
        const exists = await Role.findByPk(value);
        if (!exists) throw new Error("El rol seleccionado no existe.");
        return true;
      }),
];

const validateUpdateUser = [
  body("contraseña")
    .optional()
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateUser, validateUpdateUser, validateId };