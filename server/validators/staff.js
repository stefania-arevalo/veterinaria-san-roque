const { body, param } = require("express-validator");
const Locality = require("../models/locality");
const User = require("../models/user");
const Staff = require("../models/staff");
const Client = require("../models/client");

const validateCreateStaff = [
  body("nombres")
    .notEmpty().withMessage("El nombre es obligatorio.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre no puede contener números ni símbolos."),
  body("apellidos")
    .notEmpty().withMessage("El apellido es obligatorio.")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El apellido no puede contener números ni símbolos."),
  body("dni")
    .notEmpty().withMessage("El DNI es obligatorio.")
    .isLength({ min: 7, max: 10 }).withMessage("El DNI debe tener entre 7 y 10 caracteres.")
    .isNumeric().withMessage("El DNI debe contener solo números.")
    .custom(async (dni) => {
      const inStaff = await Staff.findOne({ where: { dni } });
      if (inStaff) throw new Error("Este DNI pertenece a un registro de personal.");
      const inClient = await Client.findOne({ where: { dni } });
      if (inClient) throw new Error("Ya existe un cliente con este DNI.");
      return true;
    }),
  body("sexo").isIn(["M","F","O"]).withMessage("El sexo debe ser M, F u O."),
  body("fechaNacimiento").isDate().withMessage("Fecha de nacimiento inválida."),
  body("correo").optional().isEmail().withMessage("El formato del correo no es válido."),
  body("idLocalidad")
    .optional()
    .isInt().withMessage("El idLocalidad debe ser un entero.")
    .custom(async (value) => {
      const exists = await Locality.findByPk(value);
      if (!exists) throw new Error("La localidad seleccionada no existe.");
      return true;
    }),
  body("idUsuario")
    .optional()
    .isInt().withMessage("El idUsuario debe ser un entero.")
    .custom(async (value) => {
      const exists = await User.findByPk(value);
      if (!exists) throw new Error("El usuario seleccionado no existe.");
      return true;
    }),
];

const validateUpdateStaff = [
  body("nombres")
    .optional().notEmpty()
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre no puede contener números ni símbolos."),
  body("apellidos")
    .optional().notEmpty()
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El apellido no puede contener números ni símbolos."),
  body("dni")
    .optional().notEmpty()
    .isLength({ min: 7, max: 10 }).withMessage("El DNI debe tener entre 7 y 10 caracteres.")
    .isNumeric().withMessage("El DNI debe contener solo números."),
  body("sexo").optional().isIn(["M","F","O"]),
  body("fechaNacimiento").optional().isDate(),
  body("correo").optional().isEmail(),
  body("idLocalidad")
    .optional()
    .isInt().withMessage("El idLocalidad debe ser un entero.")
    .custom(async (value) => {
      const exists = await Locality.findByPk(value);
      if (!exists) throw new Error("La localidad seleccionada no existe.");
      return true;
    }),
  body("idUsuario")
    .optional()
    .isInt().withMessage("El idUsuario debe ser un entero.")
    .custom(async (value) => {
      const exists = await User.findByPk(value);
      if (!exists) throw new Error("El usuario seleccionado no existe.");
      return true;
    }),
 
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateStaff, validateUpdateStaff, validateId };