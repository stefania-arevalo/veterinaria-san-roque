const { body, param } = require("express-validator");
const Provider = require("../models/provider");
const Visitor = require("../models/visitor"); // Importamos el modelo para la validación

const validateCreate = [
    // 1. Validaciones individuales de campo
    body("nombre").notEmpty().withMessage("El nombre es obligatorio."),
    body("apellido").notEmpty().withMessage("El apellido es obligatorio."),
    body("correo").optional().isEmail().withMessage("El formato del correo no es válido."),
    body("idProveedor")
        .isInt().withMessage("El ID de proveedor debe ser un entero.")
        .custom(async (value) => {
            const providerExists = await Provider.findByPk(value);
            if (!providerExists) throw new Error("El proveedor no existe.");
            return true;
        }),

    // 2. Validación de "Duplicidad Total" (evitar que ingresen los mismos datos)
    body().custom(async (body) => {
        const { nombre, apellido, telefono, correo, idProveedor } = body;

        // Construimos la query para manejar nulos
        const whereClause = {
            nombre: nombre ? nombre.trim() : null,
            apellido: apellido ? apellido.trim() : null,
            telefono: telefono ? telefono.trim() : null,
            idProveedor: idProveedor
        };

        // Si el correo es nulo, buscamos nulos, si no, buscamos el valor
        whereClause.correo = correo ? correo.trim().toLowerCase() : { [Op.is]: null };

        const duplicate = await Visitor.findOne({ where: whereClause });

        if (duplicate) {
            throw new Error("Ya existe un visitador registrado con exactamente estos mismos datos.");
        }
        return true;
    })
];

const validateUpdate = [
    body("correo").optional().isEmail().withMessage("El formato del correo no es válido."),
    body("idProveedor")
        .optional()
        .isInt().withMessage("El ID de proveedor debe ser un entero.")
        .custom(async (value) => {
            const providerExists = await Provider.findByPk(value);
            if (!providerExists) throw new Error("El proveedor no existe.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };