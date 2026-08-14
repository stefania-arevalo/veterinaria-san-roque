const { body, param } = require("express-validator");
const Product = require("../models/product"); 
const ProductPresentation = require("../models/productPresentation"); 

const validateCreate = [
    body("idProducto")
        .isInt().withMessage("El ID de producto debe ser un entero.")
        .custom(async (value) => {
            const product = await Product.findByPk(value);
            if (!product) throw new Error("El producto seleccionado no existe.");
            return true;
        }),
    body("idProd_Pres")
        .optional()
        .isInt().withMessage("El ID de presentación debe ser un entero.")
        .custom(async (value) => {
            const presentation = await ProductPresentation.findByPk(value);
            if (!presentation) throw new Error("La presentación seleccionada no existe.");
            return true;
        }),
    body("codigoLote")
        .notEmpty().withMessage("El código de lote es obligatorio.")
        .isString().withMessage("El código de lote debe ser una cadena de texto.")
        .trim() 
        .customSanitizer(value => value ? value.toUpperCase() : value),
    body("fechaVencimiento")
        .isDate().withMessage("La fecha de vencimiento no es válida."),
    body("cantidadDisponible")
        .isInt({ min: 0 }).withMessage("La cantidad debe ser un número entero mayor o igual a 0.")
];

const validateUpdate = [
    body("idProducto")
        .isInt().withMessage("El ID de producto debe ser un entero.")
        .custom(async (value) => {
            const product = await Product.findByPk(value);
            if (!product) throw new Error("El producto seleccionado no existe.");
            return true;
        }),
    body("idProd_Pres")
        .optional()
        .isInt().withMessage("El ID de presentación debe ser un entero.")
        .custom(async (value) => {
            const presentation = await ProductPresentation.findByPk(value);
            if (!presentation) throw new Error("La presentación seleccionada no existe.");
            return true;
        }),
    body("fechaVencimiento").optional().isDate().withMessage("La fecha de vencimiento no es válida."),
    body("codigoLote")
        .optional()
        .isString().withMessage("El código de lote debe ser una cadena de texto.")
        .trim()
        .customSanitizer(value => value ? value.toUpperCase() : value),
    body("cantidadDisponible")
        .optional()
        .isInt({ min: 0 }).withMessage("La cantidad debe ser un número entero mayor o igual a 0.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };