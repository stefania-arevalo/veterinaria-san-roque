const AppointmentState = require("../models/appointmentState");

async function createAppointmentState(req, res, next) {
    try {
        const state = await AppointmentState.create(req.body);
        return res.status(201).send(state);
    } catch (error) {
        next(error);
    }
}

async function getAppointmentStates(req, res, next) {
    try {
        const states = await AppointmentState.findAll();
        return res.status(200).send(states);
    } catch (error) {
        next(error);
    }
}

async function getAppointmentState(req, res, next) {
    try {
        const state = await AppointmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        return res.status(200).send(state);
    } catch (error) {
        next(error);
    }
}

async function updateAppointmentState(req, res, next) {
    try {
        const state = await AppointmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        
        await state.update(req.body);
        return res.status(200).send({ msg: "Estado actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteAppointmentState(req, res, next) {
    try {
        const deleted = await AppointmentState.destroy({ where: { idEstadoCita: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Estado eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createAppointmentState, 
    getAppointmentStates, 
    getAppointmentState, 
    updateAppointmentState, 
    deleteAppointmentState 
};