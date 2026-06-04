const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const Treatment = require("../models/treatment");
const ClinicalHistory = require("../models/clinicalHistory");
const TreatmentType = require("../models/treatmentType"); 
const TreatmentState = require("../models/treatmentState");

// validators/treatment.js
const validateCreate = [
    body("fechaInicio")
        .notEmpty().withMessage("La fecha de inicio es obligatoria.")
        .isDate({ strictMode: false }).withMessage("Formato de fecha inválido."),
    
    body("fechaFin")
        .optional({ nullable: true, checkFalsy: true })
        .isDate({ strictMode: false }).withMessage("Formato de fecha inválido."),
    
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3 }).withMessage("La descripción debe tener al menos 3 caracteres."),
    
    body("idHistorial")
        .notEmpty().withMessage("El historial es obligatorio.")
        .isInt().withMessage("idHistorial debe ser un entero.")
        .custom(async (val) => {
            const exists = await ClinicalHistory.findByPk(val);
            if (!exists) throw new Error("El historial clínico no existe.");
        }),
    
    body("idTipoTratamiento")
        .notEmpty().withMessage("El tipo de tratamiento es obligatorio.")
        .isInt().withMessage("idTipoTratamiento debe ser un entero.")
        .custom(async (val) => {
            const exists = await TreatmentType.findByPk(val);
            if (!exists) throw new Error("El tipo de tratamiento no existe.");
        }),
    
    body("idEstadoTratamiento")
        .notEmpty().withMessage("El estado es obligatorio.")
        .isInt().withMessage("idEstadoTratamiento debe ser un entero.")
        .custom(async (val) => {
            const exists = await TreatmentState.findByPk(val);
            if (!exists) throw new Error("El estado de tratamiento no existe.");
        }),

    body().custom(async (body) => {
        const { idHistorial, idTipoTratamiento, descripcion, fechaInicio } = body;
        if (!idHistorial || !idTipoTratamiento || !descripcion || !fechaInicio) return true;
        const duplicate = await Treatment.findOne({ 
            where: { idHistorial, idTipoTratamiento, descripcion: descripcion.trim(), fechaInicio } 
        });
        if (duplicate) throw new Error("Ya existe un tratamiento similar registrado en este historial.");
    }),
];

const validateUpdate = [
    body("fechaInicio")
        .optional()   // ← CORREGIDO: opcional en update
        .isDate({ strictMode: false }).withMessage("Formato de fecha inválido."),
    
    body("fechaFin")
        .optional({ nullable: true, checkFalsy: true })
        .isDate({ strictMode: false }),
    
    body("descripcion")
        .optional()
        .isLength({ min: 3 }).withMessage("La descripción debe tener al menos 3 caracteres."),
    
    body("idHistorial").optional().isInt()
        .custom(async (val) => {
            const exists = await ClinicalHistory.findByPk(val);
            if (!exists) throw new Error("El historial clínico no existe.");
        }),
    
    body("idTipoTratamiento").optional().isInt()
        .custom(async (val) => {
            const exists = await TreatmentType.findByPk(val);
            if (!exists) throw new Error("El tipo de tratamiento no existe.");
        }),
    
    body("idEstadoTratamiento").optional().isInt(),
    
    body().custom(async (body) => {
        const { idHistorial, idTipoTratamiento, descripcion, fechaInicio } = body;
        if (!idHistorial || !idTipoTratamiento || !descripcion || !fechaInicio) return true;
        const duplicate = await Treatment.findOne({ 
            where: { idHistorial, idTipoTratamiento, descripcion: descripcion.trim(), fechaInicio } 
        });
        if (duplicate) throw new Error("Ya existe un tratamiento similar registrado en este historial.");
    }),
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };