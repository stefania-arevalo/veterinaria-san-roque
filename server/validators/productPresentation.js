const { body, param } = require("express-validator");
const ProductPresentation = require("../models/productPresentation");
const Product = require("../models/product");
const Presentation = require("../models/presentation"); // Asegúrate de tener este modelo

const validateCreate = [
    body("idProducto")
        .isInt().withMessage("El ID de producto debe ser un entero.")
        .custom(async (value) => {
            const productExists = await Product.findByPk(value);
            if (!productExists) throw new Error("El producto seleccionado no existe.");
            return true;
        }),
    body("idPresentacion")
        .isInt().withMessage("El ID de presentación debe ser un entero.")
        .custom(async (value) => {
            const presExists = await Presentation.findByPk(value);
            if (!presExists) throw new Error("La presentación seleccionada no existe.");
            return true;
        }),
    body("precio")
        .isDecimal().withMessage("El precio debe ser un número decimal.")
        .custom((value) => {
            if (parseFloat(value) < 0) throw new Error("El precio no puede ser negativo.");
            return true;
        }),
    // Validación de duplicidad (Combinación única)
    body().custom(async (body) => {
        const { idProducto, idPresentacion } = body;
        const exists = await ProductPresentation.findOne({ where: { idProducto, idPresentacion } });
        if (exists) throw new Error("Esta presentación ya está asignada a este producto.");
        return true;
    })
];

const validateUpdate = [
    body("precio")
        .optional()
        .isDecimal().withMessage("El precio debe ser un número decimal.")
        .custom((value) => {
            if (parseFloat(value) < 0) throw new Error("El precio no puede ser negativo.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };