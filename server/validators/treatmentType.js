const { body, param } = require("express-validator");
const TreatmentType = require("../models/treatmentType");
const { Op } = require("sequelize");

const validateCreate = [
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio.")
        .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres.")
        .custom(async (value) => {
            const existing = await TreatmentType.findOne({ where: { nombre: value } });
            if (existing) throw new Error("Ya existe un tipo de tratamiento con este nombre.");
            return true;
        }),
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
];

const validateUpdate = [
    body("nombre")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("El nombre debe tener entre 3 y 50 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await TreatmentType.findOne({ 
                where: { 
                    nombre: value,
                    idTipoTratamiento: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otro tipo de tratamiento con este nombre.");
            return true;
        }),
    body("descripcion")
        .optional()
        .notEmpty().withMessage("La descripción no puede estar vacía.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };