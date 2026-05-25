const { body, param } = require("express-validator");
const Vaccine = require("../models/vaccine");
const Product = require("../models/product");

const validateCreate = [
    body("idProducto")
        .isInt().withMessage("El ID de producto debe ser un entero.")
        .custom(async (value) => {
            // 1. Verificar si el producto existe
            const productExists = await Product.findByPk(value);
            if (!productExists) throw new Error("El producto base no existe.");
            
            // 2. Verificar que no esté ya registrado como vacuna (evitar duplicado)
            const isVaccine = await Vaccine.findByPk(value);
            if (isVaccine) throw new Error("Este producto ya está registrado como vacuna.");
            
            return true;
        }),
    body("dosis")
        .notEmpty().withMessage("La dosis es obligatoria.")
        .isLength({ max: 50 }),
    body("enfermedadPreventiva")
        .notEmpty().withMessage("Debe especificar la enfermedad que previene.")
        .isLength({ max: 100 }),
    body("idEspecie")
        .optional({ nullable: true })
        .isInt().withMessage("El ID de especie debe ser un entero.")
];

const validateUpdate = [
    body("dosis")
        .optional()
        .isLength({ max: 50 }),
    body("enfermedadPreventiva")
        .optional()
        .isLength({ max: 100 }),
    body("idEspecie")
        .optional({ nullable: true })
        .isInt().withMessage("El ID de especie debe ser un entero.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };