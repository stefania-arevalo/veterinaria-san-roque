const { body, param } = require("express-validator");
const Medication = require("../models/medication");
const Product = require("../models/product");
const MedicationType = require("../models/medicationType");
const { Op } = require("sequelize");

const validateCreate = [
    body("idProducto")
        .isInt().withMessage("El ID de producto debe ser un entero.")
        .custom(async (value) => {
            // 1. Verificamos que el producto exista en la tabla general
            const productExists = await Product.findByPk(value);
            if (!productExists) throw new Error("El producto seleccionado no existe.");

            // 2. Verificamos que NO esté ya registrado como medicamento
            const isAlreadyMedication = await Medication.findByPk(value);
            if (isAlreadyMedication) throw new Error("Este producto ya está registrado como medicamento.");
            
            return true;
        }),
    body("idTipoMedicacion")
        .isInt().withMessage("El ID de tipo de medicación debe ser un entero.")
        .custom(async (value) => {
            const exists = await MedicationType.findByPk(value);
            if (!exists) throw new Error("El tipo de medicación no existe.");
            return true;
        }),
    body("ventaLibre")
        .isBoolean().withMessage("El valor de venta libre debe ser un booleano.")
];

const validateUpdate = [
    // En el update no se valida el ID del producto si es la Primary Key
    // porque el producto ya existe (por eso lo estamos editando).
    body("idTipoMedicacion")
        .optional()
        .isInt().withMessage("El ID de tipo de medicación debe ser un entero.")
        .custom(async (value) => {
            const exists = await MedicationType.findByPk(value);
            if (!exists) throw new Error("El tipo de medicación no existe.");
            return true;
        }),
    body("ventaLibre")
        .optional()
        .isBoolean().withMessage("El valor de venta libre debe ser un booleano.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };