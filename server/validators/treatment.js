const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const Treatment = require("../models/treatment");
const ClinicalHistory = require("../models/clinicalHistory");
const TreatmentType = require("../models/treatmentType"); 
const TreatmentState = require("../models/treatmentState");

const validateCreate = [
    body("fechaInicio")
        .notEmpty().withMessage("La fecha de inicio es obligatoria.")
        .isDate({ strictMode: false }).withMessage("Formato de fecha inválido."),
    body("fechaFin").optional().isDate().withMessage("Formato de fecha inválido."),
    body("descripcion").notEmpty().trim().isLength({ min: 5 }).withMessage("La descripción es obligatoria y debe ser más larga."),
    
    body("idHistorial").notEmpty().isInt().custom(async (val) => {
        const exists = await ClinicalHistory.findByPk(val);
        if (!exists) throw new Error("El historial clínico no existe.");
    }),
    body("idTipoTratamiento").notEmpty().isInt().custom(async (val) => {
        const exists = await TreatmentType.findByPk(val);
        if (!exists) throw new Error("El tipo de tratamiento no existe.");
    }),
    body("idEstadoTratamiento").notEmpty().isInt().custom(async (val) => {
        const exists = await TreatmentState.findByPk(val);
        if (!exists) throw new Error("El estado de tratamiento no existe.");
    }),

    // Validación de duplicidad
    body().custom(async (body) => {
        const { idHistorial, idTipoTratamiento, descripcion, fechaInicio } = body;
        
        // Guard: si falta algún campo, los otros validators ya lo reportan
        if (!idHistorial || !idTipoTratamiento || !descripcion || !fechaInicio) return true;
        
        const duplicate = await Treatment.findOne({ 
            where: { 
                idHistorial, 
                idTipoTratamiento, 
                descripcion: descripcion.trim(), 
                fechaInicio 
            } 
        });
        if (duplicate) throw new Error("Ya existe un tratamiento similar registrado en este historial.");
    }),
];

const validateUpdate = [
    body("fechaInicio")
        .notEmpty().withMessage("La fecha de inicio es obligatoria.")
        .isDate({ strictMode: false }).withMessage("Formato de fecha inválido."),
    body("fechaFin").optional().isDate(),
    body("descripcion").optional().trim().notEmpty(),
    body("idHistorial").optional().isInt().custom(async (val) => {
        const exists = await ClinicalHistory.findByPk(val);
        if (!exists) throw new Error("El historial clínico no existe.");
    }),
    body("idTipoTratamiento").optional().isInt().custom(async (val) => {
        const exists = await TreatmentType.findByPk(val);
        if (!exists) throw new Error("El tipo de tratamiento no existe.");
    }),
    body("idEstadoTratamiento").optional().isInt(),
    
    body().custom(async (body) => {
        const { idHistorial, idTipoTratamiento, descripcion, fechaInicio } = body;
        
        // Guard: si falta algún campo, los otros validators ya lo reportan
        if (!idHistorial || !idTipoTratamiento || !descripcion || !fechaInicio) return true;
        
        const duplicate = await Treatment.findOne({ 
            where: { 
                idHistorial, 
                idTipoTratamiento, 
                descripcion: descripcion.trim(), 
                fechaInicio 
            } 
        });
        if (duplicate) throw new Error("Ya existe un tratamiento similar registrado en este historial.");
    }),
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };