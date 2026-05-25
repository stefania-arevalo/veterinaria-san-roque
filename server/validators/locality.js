const { body, param } = require("express-validator");
const Locality = require("../models/locality");
const { Op } = require("sequelize");

const validateCreateLocality = [
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio.")
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value) => {
            const existing = await Locality.findOne({ where: { nombre: value } });
            if (existing) throw new Error("Ya existe una localidad con este nombre.");
            return true;
        })
];

const validateUpdateLocality = [
    body("nombre")
        .optional()
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await Locality.findOne({ 
                where: { 
                    nombre: value,
                    idLocalidad: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otra localidad con este nombre.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateLocality, validateUpdateLocality, validateId };