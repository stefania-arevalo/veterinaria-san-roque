const { body, param } = require("express-validator");
const Staff = require("../models/staff");
const Provider = require("../models/provider");
const Visitor = require("../models/visitor"); 
const PaymentType = require("../models/paymentType");
const ReceiptType = require("../models/receiptType");
const Product = require("../models/product");
const ProductPresentation = require("../models/productPresentation");

const validateCreatePurchase = [
  body("fecha")
    .notEmpty().withMessage("La fecha es obligatoria.")
    .isDate().withMessage("El formato de fecha no es válido.")

  body("hora")
    .notEmpty().withMessage("La hora es obligatoria.")
    .matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/).withMessage("Formato HH:MM."),

  body("iva")
    .notEmpty().withMessage("El IVA es obligatorio.")
    .isDecimal().withMessage("El IVA debe ser un número decimal."),

  body("descuento")
    .optional()
    .isDecimal({ min: 0 }).withMessage("El descuento debe ser un número decimal no negativo."),

  body("idPersonal")
    .notEmpty().withMessage("El personal es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Staff.findByPk(value);
      if (!exists) throw new Error("El personal seleccionado no existe.");
      return true;
    }),

  body("idProveedor")
    .notEmpty().withMessage("El proveedor es obligatorio.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Provider.findByPk(value);
      if (!exists) throw new Error("El proveedor seleccionado no existe.");
      return true;
    }),

  body("idVisitador")
    .customSanitizer(value => (value === "" || value === undefined || value === null) ? null : value)
    .optional({ nullable: true })
    .custom(async (value) => {
      if (value === null) return true;

      // Forzar conversión limpia a número base 10
      const idInt = parseInt(value, 10);
      if (isNaN(idInt) || idInt <= 0) {
        throw new Error("El ID del visitador debe ser un número entero válido.");
      }

      // Buscar en tu modelo usando Sequelize
      const exists = await Visitor.findByPk(idInt);
      if (!exists) {
        throw new Error("El visitador seleccionado no existe en el sistema.");
      }
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
    .notEmpty().withMessage("Debe incluir al menos un producto.")
    .isArray({ min: 1 }).withMessage("Productos debe ser un array con al menos un elemento."),

  body("items.*.idProducto")
    .notEmpty().withMessage("Cada producto debe tener un idProducto.")
    .isInt({ min: 1 }).withMessage("Debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await Product.findByPk(value);
      if (!exists) throw new Error("Uno de los productos seleccionados no existe.");
      return true;
    }),

  body("items.*.idProductoPresentacion")
    .notEmpty().withMessage("Cada producto debe tener un idProductoPresentacion.")
    .isInt({ min: 1 }).withMessage("El ID de la presentación debe ser un número entero válido.")
    .custom(async (value) => {
      const exists = await ProductPresentation.findByPk(value);
      if (!exists) throw new Error("Una de las presentaciones de producto seleccionadas no existe.");
      return true;
    }),

  body("items.*.idPresentacion")
    .notEmpty().withMessage("El idPresentacion es obligatorio para procesar el stock.")
    .isInt({ min: 1 }).withMessage("El ID de presentación debe ser un número entero válido."),

  body("items.*.codigoLote")
    .notEmpty().withMessage("El código de lote es obligatorio.")
    .isString().withMessage("El código de lote debe ser un texto.")
    .trim()
    .customSanitizer(v => v.toUpperCase()), // Pasa automáticamente a mayúsculas como espera tu controlador

  body("items.*.fechaVencimiento")
    .notEmpty().withMessage("La fecha de vencimiento del lote es obligatoria.")
    .isDate().withMessage("El formato de la fecha de vencimiento no es válido (YYYY-MM-DD)."),

  body("items.*.cantidad")
    .notEmpty().withMessage("La cantidad es obligatoria.")
    .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),

  body("items.*.precioUnidad")
    .notEmpty().withMessage("El precio de compra (costo) es obligatorio.")
    .isDecimal({ min: 0.01 }).withMessage("El precio de costo debe ser mayor a 0."),

  body("items.*.precioVentaPublico")
    .notEmpty().withMessage("El precio de venta al público es obligatorio.")
    .isDecimal({ min: 0.01 }).withMessage("El precio de venta debe ser mayor a 0.")
    .custom((value, { req, path }) => {
        // Opcional: Validar que el precio de venta no sea menor al precio de costo (para no perder dinero)
        const match = path.match(/items\[(\d+)\]/);
        if (match) {
            const index = match[1];
            const precioCosto = parseFloat(req.body.items[index].precioUnidad);
            const precioVenta = parseFloat(value);
            
            if (precioVenta < precioCosto) {
                throw new Error("El precio de venta no puede ser menor al costo de compra.");
            }
        }
        return true;
    }),
];

const validateUpdatePurchase = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),

  body("fecha")
    .optional()
    .isDate().withMessage("El formato de fecha no es válido. Use YYYY-MM-DD."),

  body("descuento")
    .optional()
    .isDecimal({ min: 0 }).withMessage("El descuento debe ser un número decimal no negativo."),
];

const validateId = [
  param("id")
    .isInt({ min: 1 }).withMessage("El ID debe ser un número entero válido."),
];

module.exports = { validateCreatePurchase, validateUpdatePurchase, validateId };