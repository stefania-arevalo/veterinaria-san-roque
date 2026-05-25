const ServiceAppointmentState = require("../models/serviceAppointmentState");

async function createServiceAppointmentState(req, res, next) {
    try {
        const state = await ServiceAppointmentState.create(req.body);
        return res.status(201).send(state);
    } catch (error) {
        next(error);
    }
}

async function getServiceAppointmentStates(req, res, next) {
    try {
        const states = await ServiceAppointmentState.findAll();
        return res.status(200).send(states);
    } catch (error) {
        next(error);
    }
}

async function getServiceAppointmentState(req, res, next) {
    try {
        const state = await ServiceAppointmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        return res.status(200).send(state);
    } catch (error) {
        next(error);
    }
}

async function updateServiceAppointmentState(req, res, next) {
    try {
        const state = await ServiceAppointmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        
        await state.update(req.body);
        return res.status(200).send({ msg: "Estado actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteServiceAppointmentState(req, res, next) {
    try {
        const deleted = await ServiceAppointmentState.destroy({ 
            where: { idEstadoServicio: req.params.id } 
        });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Estado eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createServiceAppointmentState, 
    getServiceAppointmentStates, 
    getServiceAppointmentState, 
    updateServiceAppointmentState, 
    deleteServiceAppointmentState 
};