const PetState = require("../models/petState");

async function createPetState(req, res, next) {
    try {
        const newState = await PetState.create(req.body);
        return res.status(201).send(newState);
    } catch (error) {
        next(error);
    }
}

async function getPetStates(req, res, next) {
    try {
        const states = await PetState.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(states);
    } catch (error) {
        next(error);
    }
}

async function getPetState(req, res, next) {
    try {
        const state = await PetState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "Estado no encontrado." });
        return res.status(200).send(state);
    } catch (error) {
        next(error);
    }
}

async function updatePetState(req, res, next) {
    try {
        const state = await PetState.findByPk(req.params.id);
        if (!state) return res.status(404).send({ msg: "El estado no existe." });
        
        await state.update(req.body);
        return res.status(200).send({ msg: "Estado actualizado.", state });
    } catch (error) {
        next(error);
    }
}

async function deletePetState(req, res, next) {
    try {
        const deleted = await PetState.destroy({ where: { idEstadoMascota: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontró el estado para eliminar." });
        return res.status(200).send({ msg: "Estado eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPetState,
    getPetStates,
    getPetState,
    updatePetState,
    deletePetState
};