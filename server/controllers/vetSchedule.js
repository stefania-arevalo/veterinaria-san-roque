const VetSchedule = require("../models/vetSchedule");
const Veterinarian = require("../models/veterinarian");
const Staff = require("../models/staff");
const Schedule = require("../models/schedule");

// 1. CREATE: Solo Admin + Verificación de Rol Veterinario
async function createVetSchedule(req, res) {
    const { idRol } = req.user; // Obtenido del middleware de auth
    const { idVeterinario, idHorario } = req.body;

    // Bloqueo por Rol: Solo Admin (idRol === 1) puede crear
    if (idRol !== 1) {
        return res.status(403).send({ msg: "No tienes permisos para asignar horarios." });
    }

    try {
        // VALIDACIÓN CRÍTICA: ¿El idPersonal pertenece a un Veterinario?
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

// 2. GET ALL: Todos los roles pueden ver
async function getVetSchedules(req, res) {
    try {
        const list = await VetSchedule.findAll({ 
            include: [
                { model: Schedule, attributes: ['diaSemana', 'turno', 'horaInicio', 'horaFin'] },
                {
                    model: Veterinarian,
                    attributes: ['especialidad'], 
                    include: [{ model: Staff, attributes: ['nombres', 'apellidos'] }]
                }
            ]
        });
        return res.status(200).send(list);
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener la lista." });
    }
}

async function getVetSchedule(req, res) {
    // CAMBIO AQUÍ: Debe coincidir con :idVeterinario y :idHorario de la ruta
    const { idVeterinario, idHorario } = req.params; 
    
    try {
        const item = await VetSchedule.findOne({ 
            where: { 
                idVeterinario: idVeterinario, 
                idHorario: idHorario 
            },
            include: [
                { model: Schedule },
                {
                    model: Veterinarian,
                    include: [{ model: Staff, attributes: ['nombres', 'apellidos'] }]
                }
            ]
        });

        if (!item) return res.status(404).send({ msg: "Asignación no encontrada." });
        
        return res.status(200).send(item);
    } catch (error) {
        // Tip: Siempre logueá el error en consola para saber qué falló exactamente
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