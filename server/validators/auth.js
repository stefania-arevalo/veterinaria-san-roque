const { body } = require("express-validator");

const validateRegister = [
  body("usuario")
    .notEmpty().withMessage("El usuario es obligatorio.")
    .isLength({ min: 3 }).withMessage("El usuario debe tener al menos 3 caracteres."),

  body("contraseña")
    .notEmpty().withMessage("La contraseña es obligatoria.")
    .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),

  body("idRol")
    .optional()
    .isInt({ min: 1 }).withMessage("El rol debe ser un número entero válido."),
];

const validateLogin = [
  body("usuario")
    .notEmpty().withMessage("El usuario es obligatorio."),

  body("contraseña")
    .notEmpty().withMessage("La contraseña es obligatoria."),
];

const validateRefresh = [
  body("token")
    .notEmpty().withMessage("Token requerido."),
];

module.exports = { validateRegister, validateLogin, validateRefresh };