const { body, param } = require("express-validator");
const Sale = require("../models/sale");
const Product = require("../models/product");
const Batch = require("../models/batch");
const AppointmentDetail = require("../models/appointmentDetail");

const validateCreateSaleDetail = [
  body("idVenta")
    .notEmpty().withMessage("El ID de venta es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Sale.findByPk(value);
      if (!exists) throw new Error("La Venta no existe en la base de datos.");
      return true;
    }),

  body("cantidad")
    .notEmpty().withMessage("La cantidad es obligatoria.")
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un entero mayor a 0."),

  body("idProducto")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Product.findByPk(value);
      if (!exists) throw new Error("El producto no existe en la base de datos.");
      return true;
    }),

  body("idLote")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Batch.findByPk(value);
      if (!exists) throw new Error("El lote no existe en la base de datos.");
      return true;
    }),

  body("idDetalleCitaServicio")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await AppointmentDetail.findByPk(value);
      if (!exists) throw new Error("Uno de los detalles seleccionados no existe.");
      return true;
    }),
];

const validateUpdateSaleDetail = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),

  body("cantidad")
    .optional()
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un entero mayor a 0."),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreateSaleDetail, validateUpdateSaleDetail, validateId };