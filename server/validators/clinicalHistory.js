const { body, param } = require("express-validator");
const { Op } = require("sequelize");
const ClinicalHistory = require("../models/clinicalHistory");
const Veterinarian = require("../models/veterinarian");
const Pet = require("../models/pet");
const Appointment = require("../models/appointment");
const PetState = require("../models/petState");
const AppointmentDetail = require("../models/appointmentDetail");

const validateCreate = [
    body("peso")
        .optional({ nullable: true }) 
        .custom((value) => {
            if (!value || isNaN(value) || value < 0.1) throw new Error("El peso debe ser un número decimal mayor a 0.");
            return true;
        }),
    body("temperatura")
        .optional({ nullable: true }) 
        .custom((value) => {
            if (!value || isNaN(value) || value < 20 || value > 50) throw new Error("La temperatura debe estar entre 20 y 50.");
            return true;
        }),
    body("motivo")
        .custom((value) => {
            if (!value || value.trim().length < 3 || value.trim().length > 255) throw new Error("El motivo debe tener entre 3 y 255 caracteres.");
            return true;
        }),
    body("sintomas")
        .optional({ nullable: true })   // ← agregás esto
        .trim(),
    body("diagnostico").notEmpty().withMessage("El diagnóstico es obligatorio."),
    body("idVeterinario")
        .isInt().withMessage("El ID del veterinario es obligatorio.")
        .custom(async (value) => {
            const exists = await Veterinarian.findByPk(value);
            if (!exists) throw new Error("El veterinario no existe.");
            return true;
        }),
    body("idMascota")
        .isInt().withMessage("El ID de la mascota es obligatorio.")
        .custom(async (value) => {
            const exists = await Pet.findByPk(value);
            if (!exists) throw new Error("La mascota no existe.");
            return true;
        }),
    body("idCita")
        .isInt().withMessage("El ID de la cita es obligatorio.")
        .custom(async (value) => {
            const exists = await Appointment.findByPk(value);
            if (!exists) throw new Error("La cita no existe.");
            return true;
        }),
    body("idEstadoMascota")
        .isInt().withMessage("El estado de la mascota es obligatorio.")
        .custom(async (value) => {
            const exists = await PetState.findByPk(value);
            if (!exists) throw new Error("El estado de mascota no existe.");
            return true;
        }),
    body().custom(async (body) => {
        const { 
            peso, temperatura, motivo, sintomas, diagnostico, 
            idVeterinario, idMascota, idCita, idEstadoMascota
        } = body;

        // Buscamos si existe alguien con todos estos datos iguales
        const duplicate = await ClinicalHistory.findOne({
            where: {
                peso,
                temperatura,
                motivo: motivo ? motivo.trim() : null,
                sintomas: sintomas ? sintomas.trim() : null,
                diagnostico: diagnostico ? diagnostico.trim() : null,
                idVeterinario,
                idMascota,
                idCita,
                idEstadoMascota,
            }
        });

        if (duplicate) {
            throw new Error("Ya existe un registro de historial clínico con estos mismos datos.");
        }
        return true;
    })
];

const validateUpdate = [
    body("peso").optional({ nullable: true }).isFloat({ min: 0.1 }).withMessage("El peso debe ser un número decimal mayor a 0."),
    body("temperatura").optional({ nullable: true }).isFloat({ min: 20, max: 50 }).withMessage("La temperatura debe estar entre 20 y 50."),
    body("motivo").optional().trim().isLength({ min: 3, max: 255 }).withMessage("El motivo debe tener entre 3 y 255 caracteres."),
    body("sintomas").optional({ nullable: true }).trim(), // ← sacás el notEmpty()
    body("diagnostico").optional().trim().notEmpty(),
    
    body().custom(async (body, { req }) => {
        const idActual = req.params.id; // ← necesitás el id del registro actual
        
        const { peso, temperatura, motivo, sintomas, diagnostico, 
                idVeterinario, idMascota, idCita, idEstadoMascota } = body;
    
        const duplicate = await ClinicalHistory.findOne({
            where: {
                peso:        peso        ? peso        : { [Op.is]: null },
                temperatura: temperatura ? temperatura : { [Op.is]: null },
                motivo:      motivo      ? motivo.trim() : null,
                sintomas:    sintomas    ? sintomas.trim() : { [Op.is]: null },
                diagnostico: diagnostico ? diagnostico.trim() : null,
                idVeterinario,
                idMascota,
                idCita,
                idEstadoMascota,
                idHistorial: { [Op.ne]: idActual } // ← CLAVE: excluye el registro actual
            }
        });
    
        if (duplicate) {
            throw new Error("Ya existe otro registro con estos mismos datos.");
        }
        return true;
    })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };