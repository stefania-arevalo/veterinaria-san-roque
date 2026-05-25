const { body, param } = require("express-validator");
const ServiceType = require("../models/serviceType");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value) => {
            const existing = await ServiceType.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe un tipo de servicio con esta descripción.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await ServiceType.findOne({ 
                where: { 
                    descripcion: value,
                    idTipoServicio: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otro tipo de servicio con esta descripción.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };