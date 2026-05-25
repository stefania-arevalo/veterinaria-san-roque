const { body, param } = require("express-validator");
const Purchase = require("../models/purchase");
const Product = require("../models/product");
const ProductPresentation = require("../models/productPresentation");
const Batch = require("../models/batch");

const validateCreatePurchaseDetail = [
  body("idCompra")
    .notEmpty().withMessage("El ID de compra es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Purchase.findByPk(value);
      if (!exists) throw new Error("La compra seleccionada no existe.");
      return true;
    }),

  body("idProducto")
    .notEmpty().withMessage("El producto es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Product.findByPk(value);
      if (!exists) throw new Error("El producto seleccionado no existe.");
      return true;
    }),

  body("idProductoPresentacion")
    .notEmpty().withMessage("Cada producto debe tener un idProductoPresentacion.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await ProductPresentation.findByPk(value);
      if (!exists) throw new Error("El producto presentacion seleccionado no existe.");
      return true;
    }),

  body("idLote")
    .notEmpty().withMessage("El lote es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Batch.findByPk(value);
      if (!exists) throw new Error("El lote seleccionado no existe.");
      return true;
    }),

  body("cantidad")
    .notEmpty().withMessage("La cantidad es obligatoria.")
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),

  body("precioUnidad")
    .notEmpty().withMessage("El precio por unidad es obligatorio.")
    .isDecimal({ min: 0 }).withMessage("Debe ser un número decimal no negativo."),
];

const validateUpdatePurchaseDetail = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),

  body("cantidad")
    .optional()
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),

  body("precioUnidad")
    .optional()
    .isDecimal({ min: 0 }).withMessage("Debe ser un número decimal no negativo."),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreatePurchaseDetail, validateUpdatePurchaseDetail, validateId };