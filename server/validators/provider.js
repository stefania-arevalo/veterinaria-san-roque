const { body, param } = require("express-validator");
const Provider = require("../models/provider");
const { Op } = require("sequelize");
const Locality = require("../models/locality");

const validateCreate = [
    body("razonSocial")
        .notEmpty().withMessage("La razón social es obligatoria.")
        .isLength({ max: 150 }).withMessage("La razón social debe tener máximo 150 caracteres."),
    
    body("cuit")
        .notEmpty().withMessage("El CUIT es obligatorio.")
        .isLength({ min: 11, max: 13 }).withMessage("El CUIT debe tener entre 11 y 13 caracteres.")
        .custom(async (value) => {
            const existing = await Provider.findOne({ where: { cuit: value } });
            if (existing) throw new Error("Ya existe un proveedor con este CUIT.");
            return true;
        }),

    body("telefono")
        .notEmpty().withMessage("El teléfono es obligatorio.")
        .isLength({ max: 15 }).withMessage("El teléfono debe tener máximo 15 caracteres."),

    body("direccion")
        .optional()
        .isLength({ max: 150 }).withMessage("La dirección debe tener máximo 150 caracteres."),

    body("correo")
        .optional()
        .isEmail().withMessage("El formato del correo electrónico no es válido."),

    body("idLocalidad")
        .notEmpty().withMessage("La localidad es obligatoria.")
        .isInt().withMessage("La localidad debe ser un ID numérico.")
        .custom(async (value) => {
            const locality = await Locality.findByPk(value);
            if (!locality) throw new Error("La localidad seleccionada no existe.");
            return true;
        })
];

const validateUpdate = [
    body("razonSocial")
        .optional()
        .isLength({ max: 150 }),
    
    body("cuit")
        .optional()
        .isLength({ min: 11, max: 13 })
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await Provider.findOne({ 
                where: { cuit: value, idProveedor: { [Op.ne]: id } } 
            });
            if (existing) throw new Error("Ya existe otro proveedor con este CUIT.");
            return true;
        }),

    body("telefono")
        .optional()
        .isLength({ max: 15 }),

    body("direccion")
        .optional()
        .isLength({ max: 150 }),

    body("correo")
        .optional()
        .isEmail().withMessage("Formato de correo inválido."),

    body("idLocalidad")
        .optional() // IMPORTANTE: Solo validar si el campo viene en el body
        .isInt().withMessage("La localidad debe ser un ID numérico.")
        .custom(async (value) => {
            const locality = await Locality.findByPk(value);
            if (!locality) throw new Error("La localidad seleccionada no existe.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };