const { body, param } = require("express-validator");
const TreatmentState = require("../models/treatmentState");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (value) => {
            const existing = await TreatmentState.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe un estado de tratamiento con esta descripción.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await TreatmentState.findOne({ 
                where: { 
                    descripcion: value,
                    idEstadoTratamiento: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otro estado con esta descripción.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };