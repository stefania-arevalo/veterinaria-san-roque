const TreatmentState = require("../models/treatmentState");

async function createTreatmentState(req, res, next) {
    try {
        const newState = await TreatmentState.create(req.body);
        return res.status(201).send(newState);
    } catch (error) {
        next(error);
    }
}

async function getTreatmentStates(req, res, next) {
    try {
        const states = await TreatmentState.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(states);
    } catch (error) {
        next(error);
    }
}

async function getTreatmentState(req, res, next) {
    try {
        const state = await TreatmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        return res.status(200).send(state);
    } catch (error) {
        next(error);
    }
}

async function updateTreatmentState(req, res, next) {
    try {
        const state = await TreatmentState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "No existe el estado solicitado." });

        await state.update(req.body);
        return res.status(200).send({ msg: "Estado actualizado.", state });
    } catch (error) {
        next(error);
    }
}

async function deleteTreatmentState(req, res, next) {
    try {
        const deleted = await TreatmentState.destroy({ where: { idEstadoTratamiento: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "Estado no encontrado." });
        return res.status(200).send({ msg: "Estado de tratamiento eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createTreatmentState,
    getTreatmentStates,
    getTreatmentState,
    updateTreatmentState,
    deleteTreatmentState
};