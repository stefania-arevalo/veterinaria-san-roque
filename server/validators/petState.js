const { body, param } = require("express-validator");
const PetState = require("../models/petState");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 50 }).withMessage("Debe tener entre 3 y 50 caracteres.")
        .custom(async (value) => {
            const existing = await PetState.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe un estado de mascota con esta descripción.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("Debe tener entre 3 y 50 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await PetState.findOne({ 
                where: { 
                    descripcion: value,
                    idEstadoMascota: { [Op.ne]: id } 
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