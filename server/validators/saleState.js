const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const SaleState = require("../models/saleState");

const validateCreate = [
    body("descripcion")
        .trim()
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (val) => {
            const exists = await SaleState.findOne({ where: { descripcion: val } });
            if (exists) throw new Error("Este estado de venta ya existe.");
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .trim()
        .notEmpty().withMessage("La descripción no puede estar vacía.")
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (val, { req }) => {
            const idActual = req.params.id;
            const exists = await SaleState.findOne({ 
                where: { descripcion: val, idEstadoVenta: { [Op.ne]: idActual } } 
            });
            if (exists) throw new Error("Ya existe otro estado de venta con esa descripción.");
        })
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };