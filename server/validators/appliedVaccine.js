const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const AppliedVaccine = require("../models/appliedVaccine");
const ClinicalHistory = require("../models/clinicalHistory");
const Product = require("../models/product");
const Batch = require("../models/batch");

const validateCreate = [
    body("idHistorial")
        .notEmpty().withMessage("El ID del historial es obligatorio.")
        .isInt().withMessage("El ID del historial debe ser un número entero.")
        .custom(async (val) => {
            const exists = await ClinicalHistory.findByPk(val);
            if (!exists) throw new Error("El historial clínico no existe.");
        }),
    body("idVacuna")
        .notEmpty().withMessage("El ID de la vacuna es obligatorio.")
        .isInt().withMessage("El ID de la vacuna debe ser un número entero.")
        .custom(async (val) => {
            const exists = await Product.findByPk(val);
            if (!exists) throw new Error("La vacuna no existe.");
        }),
    body("idLote")
        .optional({ nullable: true }),
    body("dosis")
        .notEmpty().withMessage("La dosis es obligatoria.")
        .trim()
        .isLength({ max: 50 }).withMessage("La dosis no puede exceder los 50 caracteres."),
    body("fechaAplicacion")
        .notEmpty().withMessage("La fecha de aplicación es obligatoria.")
        .isDate().withMessage("La fecha de aplicación tiene un formato inválido."),

    // Validación de duplicidad (se ejecuta al final)
    body().custom(async (body) => {
        // Solo validamos si todos los campos requeridos existen en el body
        const { idHistorial, idVacuna, idLote } = body;
        if (!idHistorial || !idVacuna || !idLote) return true;

        const duplicate = await AppliedVaccine.findOne({ where: { 
            idHistorial, 
            idVacuna, 
            idLote 
        }});
        if (duplicate) throw new Error("Esta vacuna ya ha sido registrada en este historial con este lote.");
        return true;
    })
];

const validateUpdate = [
    // En Update, usamos .optional() para permitir que solo envíen lo que quieren modificar
    // pero si lo envían, debe pasar las validaciones de tipo y no estar vacío.
    body("idHistorial").optional().isInt().withMessage("El ID del historial debe ser un entero."),
    body("idVacuna").optional().isInt().withMessage("El ID de la vacuna debe ser un entero."),
    body("idLote")
        .optional({ nullable: true }),
    body("dosis").optional().trim().notEmpty().withMessage("La dosis no puede estar vacía."),
    body("fechaAplicacion").optional().isDate().withMessage("Fecha inválida."),

    body().custom(async (body, { req }) => {
        const idActual = req.params.id;
        const { idHistorial, idVacuna, idLote } = body;
        
        // Si no se envían campos para buscar duplicidad, saltamos
        if (!idHistorial && !idVacuna && !idLote) return true;

        // Recuperar el registro actual para completar los campos que no vienen en el body
        const current = await AppliedVaccine.findByPk(idActual);
        
        const duplicate = await AppliedVaccine.findOne({
            where: {
                idHistorial: idHistorial || current.idHistorial,
                idVacuna: idVacuna || current.idVacuna,
                idLote: idLote || current.idLote,
                idVacunaAplicada: { [Op.ne]: idActual }
            }
        });
        if (duplicate) throw new Error("Ya existe otro registro con esta combinación de datos.");
        return true;
    })
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };