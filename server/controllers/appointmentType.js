const AppointmentType = require("../models/appointmentType");
const { Op } = require("sequelize");

async function createAppointmentType(req, res, next) {
    try {
        const type = await AppointmentType.create(req.body);
        return res.status(201).send(type);
    } catch (error) {
        next(error); 
    }
}

async function getAppointmentTypes(req, res, next) {
    const { search } = req.query;
    let where = search ? { descripcion: { [Op.like]: `%${search}%` } } : {};
    
    try {
        const types = await AppointmentType.findAll({ where });
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getAppointmentType(req, res, next) {
    try {
        const type = await AppointmentType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updateAppointmentType(req, res, next) {
    const { id } = req.params;
    try {
        // Find then Update para asegurar hooks
        const type = await AppointmentType.findByPk(id);
        if (!type) return res.status(404).send({ msg: "No encontrado." });
        
        await type.update(req.body);
        return res.status(200).send({ msg: "Actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteAppointmentType(req, res, next) {
    try {
        const deleted = await AppointmentType.destroy({ where: { idTipoCita: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Eliminado." });
    } catch (error) {
        next(error); // SequelizeForeignKeyConstraintError se manejará en el middleware global
    }
}

module.exports = { 
    createAppointmentType, 
    getAppointmentTypes, 
    getAppointmentType, 
    updateAppointmentType, 
    deleteAppointmentType 
};