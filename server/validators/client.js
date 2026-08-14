const { body, param } = require("express-validator");
const Staff = require("../models/staff");
const Client = require("../models/client");
const Locality = require("../models/locality");
const { Op } = require("sequelize");

const validateCreateClient = [
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

  body("sexo")
    .notEmpty().withMessage("El sexo es obligatorio.")
    .isIn(["M", "F"]).withMessage("El sexo debe ser M o F."),

  body("telefono")
    .notEmpty().withMessage("El teléfono es obligatorio.")
    .matches(/^[0-9+\-\s]+$/).withMessage("El teléfono solo puede contener números."),
  body("direccion").notEmpty().withMessage("La dirección es obligatoria."),

  body("correo")
    .optional({ nullable: true, checkFalsy: true }) 
    .isEmail().withMessage("El formato del correo no es válido."),

  body("idLocalidad")
    .notEmpty().withMessage("La localidad es obligatoria.")
    .isInt({ min: 1 }).withMessage("La localidad debe ser un entero válido.")
    .custom(async (value) => {
      const loc = await Locality.findByPk(value);
      if (!loc) throw new Error("La localidad seleccionada no existe.");
      return true;
    }),

  body("idUsuario")
    .optional({ nullable: true })
    .custom(async (idUsuario) => {
      if (!idUsuario) return true;
      const isStaff = await Staff.findOne({ where: { idUsuario } });
      if (isStaff) throw new Error("Este usuario ya pertenece al personal.");
      const isClient = await Client.findOne({ where: { idUsuario } });
      if (isClient) throw new Error("Este usuario ya está asignado a otro cliente.");
      return true;
    }),
];

const validateUpdateClient = [
  body("nombres")
    .optional()
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El nombre no puede contener números ni símbolos."),
  body("apellidos")
    .optional()
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/).withMessage("El apellido no puede contener números ni símbolos."),

  body("dni")
    .optional() 
    .isLength({ min: 7, max: 10 }).withMessage("El DNI debe tener entre 7 y 10 caracteres.")
    .isNumeric().withMessage("El DNI debe contener solo números.")
    .custom(async (dni, { req }) => {
      const inStaff = await Staff.findOne({ where: { dni } });
      if (inStaff) throw new Error("Este DNI pertenece a un registro de personal.");

      const inClient = await Client.findOne({
        where: { dni, idCliente: { [Op.ne]: req.params.id } }, 
      });
      if (inClient) throw new Error("Ya existe otro cliente con este DNI.");
      return true;
    }),

  body("sexo")
    .optional()
    .isIn(["M", "F"]).withMessage("El sexo debe ser M o F."),

  body("telefono")
    .optional()
    .matches(/^[0-9+\-\s]+$/).withMessage("El teléfono solo puede contener números."),
  body("direccion").optional(),

  body("correo")
    .optional({ nullable: true, checkFalsy: true }) 
    .isEmail().withMessage("El formato del correo no es válido."),

  body("idLocalidad")
    .optional()
    .isInt({ min: 1 }).withMessage("La localidad debe ser un entero válido.")
    .custom(async (value) => {
      const loc = await Locality.findByPk(value);
      if (!loc) throw new Error("La localidad seleccionada no existe.");
      return true;
    }),

  body("idUsuario")
    .optional({ nullable: true })
    .custom(async (idUsuario, { req }) => {
      if (!idUsuario) return true;
      const isStaff = await Staff.findOne({ where: { idUsuario } });
      if (isStaff) throw new Error("Este usuario ya pertenece al personal.");
      const isClient = await Client.findOne({
        where: { idUsuario, idCliente: { [Op.ne]: req.params.id } },
      });
      if (isClient) throw new Error("Este usuario ya está asignado a otro cliente.");
      return true;
    }),
];

const validateId = [
  param("id").isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreateClient, validateUpdateClient, validateId };