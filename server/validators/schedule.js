const { body, param } = require("express-validator");
const Schedule = require("../models/schedule");
const { Op } = require("sequelize");

const validateCreateSchedule = [
    body("diaSemana").notEmpty().withMessage("El día de la semana es obligatorio."),
    body("turno").notEmpty().withMessage("El turno es obligatorio."),
    body("horaInicio").notEmpty().withMessage("La hora de inicio es requerida."),
    body("horaFin").notEmpty().withMessage("La hora de fin es requerida."),
    
    // Validación de lógica de tiempo: Hora inicio < Hora fin
    body("horaInicio").custom((value, { req }) => {
        if (req.body.horaFin && value >= req.body.horaFin) {
            throw new Error("La hora de inicio debe ser anterior a la hora de fin.");
        }
        return true;
    }),

    // Validación de duplicidad: No crear "Lunes - Mañana" dos veces
    body("diaSemana").custom(async (value, { req }) => {
        const { turno } = req.body;
        const existing = await Schedule.findOne({ where: { diaSemana: value, turno: turno } });
        if (existing) throw new Error("Ya existe un horario para este día y turno.");
        return true;
    })
];

const validateUpdateSchedule = [
    body("horaInicio").optional().custom((value, { req }) => {
        if (req.body.horaFin && value >= req.body.horaFin) {
            throw new Error("La hora de inicio debe ser anterior a la hora de fin.");
        }
        return true;
    }),
    body("diaSemana").optional().custom(async (value, { req }) => {
        const { turno } = req.body;
        const { id } = req.params; // Obtenemos el ID del registro que editamos

        // Buscamos si existe OTRO registro con este día y turno
        const existing = await Schedule.findOne({ 
            where: { 
                diaSemana: value, 
                turno: turno || (await Schedule.findByPk(id)).turno, // Si no cambia el turno, usa el actual
                idHorario: { [Op.ne]: id } // Excluye el registro actual
            } 
        });

        if (existing) throw new Error("Ya existe otro horario con este día y turno.");
        return true;
    })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateSchedule, validateUpdateSchedule, validateId };