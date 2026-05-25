const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const ReceiptType = require("../models/receiptType");

const validateCreate = [
    body("descripcion")
        .trim()
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 2, max: 50 }).withMessage("La descripción debe tener entre 2 y 50 caracteres.")
        .custom(async (val) => {
            const exists = await ReceiptType.findOne({ where: { descripcion: val } });
            if (exists) throw new Error("Este tipo de boleta ya existe.");
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .trim()
        .notEmpty().withMessage("La descripción no puede estar vacía.")
        .isLength({ min: 2, max: 50 }).withMessage("La descripción debe tener entre 2 y 50 caracteres.")
        .custom(async (val, { req }) => {
            const idActual = req.params.id;
            const exists = await ReceiptType.findOne({ 
                where: { descripcion: val, idTipoBoleta: { [Op.ne]: idActual } } 
            });
            if (exists) throw new Error("Ya existe otro tipo de boleta con esa descripción.");
        })
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };