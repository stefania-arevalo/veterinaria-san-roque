const Schedule = require("../models/schedule");
const { Op } = require("sequelize");

async function createSchedule(req, res, next) {
    try {
        const schedule = await Schedule.create(req.body);
        return res.status(201).send(schedule);
    } catch (error) {
        next(error);
    }
}

async function getSchedules(req, res, next) {
    const { diaSemana, turno } = req.query;
    let whereClause = {};
    if (diaSemana) whereClause.diaSemana = { [Op.like]: `%${diaSemana}%` };
    if (turno) whereClause.turno = { [Op.like]: `%${turno}%` };

    try {
        const schedules = await Schedule.findAll({ where: whereClause });
        return res.status(200).send(schedules);
    } catch (error) {
        next(error);
    }
}

async function getSchedule(req, res, next) {
    try {
        const schedule = await Schedule.findByPk(req.params.id);
        if (!schedule) return res.status(404).send({ msg: "Horario no encontrado." });
        return res.status(200).send(schedule);
    } catch (error) {
        next(error);
    }
}

async function updateSchedule(req, res, next) {
    const { id } = req.params;

    try {
        // 1. Buscamos la instancia directamente
        const schedule = await Schedule.findByPk(id);

        // 2. Si no existe, devolvemos 404 (esto soluciona el problema de "no encontrado")
        if (!schedule) {
            return res.status(404).send({ msg: "Horario no encontrado." });
        }

        // 3. Actualizamos la instancia (esto dispara los hooks automáticamente)
        await schedule.update(req.body);

        return res.status(200).send({ msg: "Actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteSchedule(req, res, next) {
    try {
        const deleted = await Schedule.destroy({ where: { idHorario: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "Horario no encontrado." });
        return res.status(200).send({ msg: "Eliminado exitosamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createSchedule, 
    getSchedules, 
    getSchedule, 
    updateSchedule, 
    deleteSchedule 
};