const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const PaymentType = require("../models/paymentType");

const validateCreate = [
    body("descripcion")
        .trim()
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 50 }).withMessage("La descripción debe tener entre 3 y 50 caracteres.")
        .custom(async (val) => {
            const exists = await PaymentType.findOne({ where: { descripcion: val } });
            if (exists) throw new Error("Este tipo de pago ya existe.");
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
            const exists = await PaymentType.findOne({ 
                where: { 
                    descripcion: val, 
                    idTipoPago: { [Op.ne]: idActual } 
                } 
            });
            if (exists) throw new Error("Ya existe otro tipo de pago con esa descripción.");
        })
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };