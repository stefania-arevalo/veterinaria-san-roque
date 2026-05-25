const { body, param } = require("express-validator");
const Service = require("../models/service");
const ServiceType = require("../models/serviceType");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 150 }).withMessage("Debe tener entre 3 y 150 caracteres.")
        .custom(async (value) => {
            const existing = await Service.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe un servicio con esta descripción.");
            return true;
        }),
    body("idTipoServicio")
        .notEmpty().withMessage("El tipo de servicio es obligatorio.")
        .custom(async (value) => {
            const type = await ServiceType.findByPk(value);
            if (!type) throw new Error("El Tipo de Servicio seleccionado no existe.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 150 }).withMessage("Debe tener entre 3 y 150 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await Service.findOne({ 
                where: { 
                    descripcion: value,
                    idServicio: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otro servicio con esta descripción.");
            return true;
        }),
    body("idTipoServicio")
        .optional()
        .custom(async (value) => {
            const type = await ServiceType.findByPk(value);
            if (!type) throw new Error("El Tipo de Servicio seleccionado no existe.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };