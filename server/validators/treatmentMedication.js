const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const TreatmentMedication = require("../models/treatmentMedication");
const Treatment = require("../models/treatment");
const ProductPresentation = require("../models/productPresentation"); // Asegura que este modelo esté importado

const validateCreate = [
    body("idTratamiento")
        .notEmpty().withMessage("El ID de tratamiento es obligatorio.")
        .isInt().custom(async (val) => {
            const exists = await Treatment.findByPk(val);
            if (!exists) throw new Error("El tratamiento no existe.");
        }),
    body("idProd_Pres")
        .notEmpty().withMessage("La presentación del producto es obligatoria.")
        .isInt().custom(async (val) => {
            const exists = await ProductPresentation.findByPk(val);
            if (!exists) throw new Error("La presentación del producto no existe.");
        }),
    body("cantidad").notEmpty().isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),
    body("instrucciones").notEmpty().trim().withMessage("Las instrucciones son obligatorias."),
    body("precioAplicado").optional().isDecimal(),
    body("notas").optional().trim(),
    body("aplicadoEnClinica")
        .optional()
        .isIn([0, 1]).withMessage("El valor debe ser 0 o 1."),

    // Validación de duplicidad: No agregar el mismo producto al mismo tratamiento dos veces
    body().custom(async (body) => {
        const { idTratamiento, idProd_Pres } = body;
        
        // Guard
        if (!idTratamiento || !idProd_Pres) return true;
        
        const duplicate = await TreatmentMedication.findOne({ 
            where: { idTratamiento, idProd_Pres } 
        });
        if (duplicate) throw new Error("Este medicamento ya ha sido asignado a este tratamiento.");
    }),
];

const validateUpdate = [
    body("idTratamiento").optional().isInt(),
    body("idProd_Pres").optional().isInt(),
    body("cantidad").optional().isInt({ min: 1 }),
    body("precioAplicado").optional().isDecimal(),
    body("notas").optional().trim(),
    body("instrucciones").optional().trim().notEmpty(),
    body("aplicadoEnClinica")
        .optional()
        .isIn([0, 1]).withMessage("El valor debe ser 0 o 1."),

    body().custom(async (body) => {
    const { idTratamiento, idProd_Pres } = body;
    
    // Guard
    if (!idTratamiento || !idProd_Pres) return true;
    
    const duplicate = await TreatmentMedication.findOne({ 
        where: { idTratamiento, idProd_Pres } 
    });
    if (duplicate) throw new Error("Este medicamento ya ha sido asignado a este tratamiento.");
}),
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un entero.")];

module.exports = { validateCreate, validateUpdate, validateId };