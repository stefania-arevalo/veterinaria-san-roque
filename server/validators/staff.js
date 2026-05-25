const { body, param } = require("express-validator");
const Locality = require("../models/locality");
const User = require("../models/user");
const Salary = require("../models/salary");
const Staff = require("../models/staff");
const Client = require("../models/client");

const validateCreateStaff = [
  body("nombres").notEmpty().withMessage("El nombre es obligatorio."),
  body("apellidos").notEmpty().withMessage("El apellido es obligatorio."),
  body("dni")
    .notEmpty().withMessage("El DNI es obligatorio.")
    .isLength({ max: 10 }).withMessage("DNI inválido.")
    .custom(async (dni) => {
        // Validar en Staff
        const inStaff = await Staff.findOne({ where: { dni } });
        if (inStaff) throw new Error("Este DNI pertenece a un registro de personal.");
        
        // Validar en Clientes
        const inClient = await Client.findOne({ where: { dni } });
        if (inClient) throw new Error("Ya existe un cliente con este DNI.");
        
        return true;
    }),
  body("sexo").isIn(['M', 'F', 'O']).withMessage("El sexo debe ser M, F u O."),
  body("fechaNacimiento").isDate().withMessage("Fecha de nacimiento inválida."),
  body("correo").isEmail().withMessage("El formato del correo no es válido."),
  
  // Validaciones con Búsqueda en DB
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
  body("idSalario")
    .optional()
    .isInt().withMessage("El idSalario debe ser un entero.")
    .custom(async (value) => {
        const exists = await Salary.findByPk(value);
        if (!exists) throw new Error("El salario seleccionado no existe.");
        return true;
    })
];

const validateUpdateStaff = [
  body("nombres").optional().notEmpty(),
  body("apellidos").optional().notEmpty(),
  body("dni").optional().notEmpty(),
  body("sexo").optional().isIn(['M', 'F', 'O']),
  body("fechaNacimiento").optional().isDate(),
  body("correo").optional().isEmail(),
  
  // Validaciones con Búsqueda en DB (solo si vienen en el body)
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
  body("idSalario")
    .optional()
    .isInt().withMessage("El idSalario debe ser un entero.")
    .custom(async (value) => {
        const exists = await Salary.findByPk(value);
        if (!exists) throw new Error("El salario seleccionado no existe.");
        return true;
    })
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateStaff, validateUpdateStaff, validateId };