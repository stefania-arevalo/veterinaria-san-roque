const { Op } = require("sequelize"); 
const VetSchedule = require("../models/vetSchedule");
const Veterinarian = require("../models/veterinarian");
const Staff = require("../models/staff");
const Schedule = require("../models/schedule");

// 1. CREATE: Solo Admin + Verificación de Rol Veterinario
async function createVetSchedule(req, res) {
    const { idRol } = req.user; 
    const { idVeterinario, idHorario } = req.body;

    if (idRol !== 1) {
        return res.status(403).send({ msg: "No tienes permisos para asignar horarios." });
    }

    try {
        const isVet = await Veterinarian.findByPk(idVeterinario);
        if (!isVet) {
            return res.status(400).send({ 
                msg: "El ID ingresado no corresponde a un Veterinario registrado." 
            });
        }

        const nuevo = await VetSchedule.create({ idVeterinario, idHorario });
        return res.status(201).send(nuevo);

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') 
            return res.status(400).send({ msg: "Esta asignación ya existe." });
        return res.status(500).send({ msg: "Error al realizar la asignación." });
    }
}

// 2. GET ALL (CON FILTROS CORREGIDOS): Todos los roles pueden ver
async function getVetSchedules(req, res) {
    const { diaSemana, idPersonal } = req.query;

    let whereVetSchedule = {};
    let whereSchedule = {};

    if (idPersonal) {
        whereVetSchedule.idVeterinario = idPersonal;
    }

    if (diaSemana) {
        whereSchedule.diaSemana = { [Op.like]: `%${diaSemana}%` };
    }

    try {
        const list = await VetSchedule.findAll({ 
            where: whereVetSchedule,
            include: [
                { 
                    model: Schedule, 
                    as: "HorarioDetail", // 🌟 CORREGIDO: Usamos el alias exacto que definiste en tu modelo
                    where: whereSchedule,
                    attributes: ['idHorario', 'diaSemana', 'turno', 'horaInicio', 'horaFin']
                },
                {
                    model: Veterinarian,
                    attributes: ['especialidad'], 
                    include: [{ model: Staff, attributes: ['nombres', 'apellidos'] }]
                }
            ]
        });

        // Mapeamos la respuesta usando la relación con su alias correspondiente
        const respuestaFormateada = list.map(item => {
            // 🌟 CORREGIDO: Extraemos los datos desde 'HorarioDetail'
            const horario = item.HorarioDetail || {}; 
            return {
                idHorario: horario.idHorario || null,
                diaSemana: horario.diaSemana || null,
                turno: horario.turno || null,
                horaInicio: horario.horaInicio || null,
                horaFin: horario.horaFin || null
            };
        });

        return res.status(200).send(respuestaFormateada);

    } catch (error) {
        console.error("Error en getVetSchedules Backend:", error);
        return res.status(500).send({ msg: "Error interno al obtener la lista de horarios." });
    }
}

// 3. GET SINGLE: Buscar asignación específica
async function getVetSchedule(req, res) {
    const { idVeterinario, idHorario } = req.params; 
    
    try {
        const item = await VetSchedule.findOne({ 
            where: { 
                idVeterinario: idVeterinario, 
                idHorario: idHorario 
            },
            include: [
                { 
                    model: Schedule,
                    as: "HorarioDetail" // 🌟 CORREGIDO: Mismo alias aquí también
                },
                {
                    model: Veterinarian,
                    include: [{ model: Staff, attributes: ['nombres', 'apellidos'] }]
                }
            ]
        });

        if (!item) return res.status(404).send({ msg: "Asignación no encontrada." });
        
        return res.status(200).send(item);
    } catch (error) {
        console.error("Error en getVetSchedule:", error);
        return res.status(500).send({ msg: "Error interno al buscar el horario." });
    }
}

// 4. DELETE: Solo Admin
async function deleteVetSchedule(req, res) {
    const { idRol } = req.user;
    const { idVeterinario, idHorario } = req.params;

    if (idRol !== 1) {
        return res.status(403).send({ msg: "Acceso denegado. Solo administradores." });
    }

    try {
        const deleted = await VetSchedule.destroy({ 
            where: { idVeterinario, idHorario } 
        });
        if (deleted === 0) return res.status(404).send({ msg: "Registro no encontrado." });
        return res.status(200).send({ msg: "Asignación eliminada correctamente." });
    } catch (error) {
        return res.status(500).send({ msg: "Error al eliminar." });
    }
}

module.exports = { 
    createVetSchedule, 
    getVetSchedules, 
    getVetSchedule, 
    deleteVetSchedule 
};