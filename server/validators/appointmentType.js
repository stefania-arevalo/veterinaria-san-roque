const { body, param } = require("express-validator");
const AppointmentType = require("../models/appointmentType");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (value) => {
            const existing = await AppointmentType.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe un tipo de cita con esta descripción.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await AppointmentType.findOne({ 
                where: { 
                    descripcion: value,
                    // Excluimos el actual para que no se autodetecte como duplicado
                    idTipoCita: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otro tipo de cita con esta descripción.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };