const { body, param } = require("express-validator");
const Staff = require("../models/staff");
const Client = require("../models/client");
const PaymentType = require("../models/paymentType");
const ReceiptType = require("../models/receiptType");
const SaleState = require("../models/saleState");
const Product = require("../models/product");
const AppointmentDetail = require("../models/appointmentDetail");
const Batch = require("../models/batch");

const validateCreateSale = [
  body("fecha")
  .notEmpty().withMessage("La fecha es obligatoria.")
  .isDate().withMessage("El formato de fecha no es válido.")
  .custom((value) => {
    // Comparar solo strings YYYY-MM-DD para evitar problema de timezone
    const hoy = new Date().toLocaleDateString('en-CA'); // "2026-05-04"
    if (value < hoy) {
        throw new Error("La fecha no puede ser anterior al día de hoy.");
    }
    return true;
}),

body("hora")
  .notEmpty().withMessage("La hora es obligatoria.")
  .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage("Formato HH:MM."),

  body("descuento")
    .optional()
    .isDecimal({ min: 0 }).withMessage("El descuento debe ser un número decimal no negativo."),

  body("idCliente")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Client.findByPk(value);
      if (!exists) throw new Error("El cliente seleccionado no existe.");
      return true;
    }),

  body("idTipoPago")
    .notEmpty().withMessage("El tipo de pago es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await PaymentType.findByPk(value);
      if (!exists) throw new Error("El tipo de pago no existe.");
      return true;
    }),

  body("idTipoBoleta")
    .notEmpty().withMessage("El tipo de boleta es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await ReceiptType.findByPk(value);
      if (!exists) throw new Error("El tipo de boleta no existe.");
      return true;
    }),

  body("items")
    .notEmpty().withMessage("Debe incluir al menos un producto o servicio.")
    .isArray({ min: 1 }).withMessage("Debe ser un array con al menos un elemento."),

  body("items.*.cantidad")
    .notEmpty().withMessage("La cantidad es obligatoria en cada ítem.")
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un entero mayor a 0."),

  body("items.*.idProducto")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Product.findByPk(value);
      if (!exists) throw new Error("Uno de los productos seleccionados no existe.");
      return true;
    }),

  body("items.*.idLote")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Batch.findByPk(value);
      if (!exists) throw new Error("Uno de los lotes seleccionados no existe.");
      return true;
    }),
    

  body("items.*.idDetalleCitaServicio")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await AppointmentDetail.findByPk(value);
      if (!exists) throw new Error("Uno de los detalles seleccionados no existe.");
      return true;
    }),
    
  body("items.*.idTratMed").optional({ nullable: true }).isInt(),
  body("items.*.idVacunaAplicada").optional({ nullable: true }).isInt(),

  // Validación lógica personalizada
  body("items").custom((items) => {
      for (const item of items) {
          if (!item.idProducto && !item.idDetalleCitaServicio && !item.idTratMed && !item.idVacunaAplicada) {
              throw new Error("Cada item debe tener una referencia válida (Producto, Servicio, Tratamiento o Vacuna).");
          }
      }
      return true;
  })
  
];


const validateUpdateSale = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),

  body("fecha")
    .optional()
    .isDate().withMessage("El formato de fecha no es válido. Use YYYY-MM-DD."),

  body("idEstadoVenta")
    .optional()
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await SaleState.findByPk(value);
      if (!exists) throw new Error("El estado de venta no existe.");
      return true;
    }),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreateSale, validateUpdateSale, validateId };