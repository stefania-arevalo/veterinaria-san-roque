const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const Treatment = require("../models/treatment");
const ClinicalHistory = require("../models/clinicalHistory");
const TreatmentType = require("../models/treatmentType"); 
const TreatmentState = require("../models/treatmentState");

const validateCreate = [
    body("fechaInicio").notEmpty().withMessage("La fecha de inicio es obligatoria.").isDate(),
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
        const duplicate = await Treatment.findOne({ 
            where: { idHistorial, idTipoTratamiento, descripcion: descripcion.trim(), fechaInicio } 
        });
        if (duplicate) throw new Error("Ya existe un tratamiento similar registrado en este historial.");
    })
];

const validateUpdate = [
    body("fechaInicio").optional().isDate(),
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
    
    body().custom(async (body, { req }) => {
        const idActual = req.params.id;
        // Si no se envían campos para validar unicidad, pasamos
        if (!body.descripcion && !body.fechaInicio) return true;

        const current = await Treatment.findByPk(idActual);
        
        const duplicate = await Treatment.findOne({
            where: {
                idHistorial: current.idHistorial,
                idTipoTratamiento: current.idTipoTratamiento,
                descripcion: body.descripcion ? body.descripcion.trim() : current.descripcion,
                fechaInicio: body.fechaInicio || current.fechaInicio,
                idTratamiento: { [Op.ne]: idActual }
            }
        });
        if (duplicate) throw new Error("Ya existe otro tratamiento con estos datos.");
    })
];

const validateId = [param("id").isInt().withMessage("El ID debe ser un número entero.")];

module.exports = { validateCreate, validateUpdate, validateId };