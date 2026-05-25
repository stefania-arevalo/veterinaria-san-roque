const TreatmentType = require("../models/treatmentType");

async function createTreatmentType(req, res, next) {
    try {
        const type = await TreatmentType.create(req.body);
        return res.status(201).send(type);
    } catch (error) {
        next(error);
    }
}

async function getTreatmentTypes(req, res, next) {
    try {
        const types = await TreatmentType.findAll({ order: [['nombre', 'ASC']] });
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getTreatmentType(req, res, next) {
    try {
        const type = await TreatmentType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "Tipo de tratamiento no encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updateTreatmentType(req, res, next) {
    try {
        const type = await TreatmentType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "No encontrado." });

        await type.update(req.body);
        return res.status(200).send({ msg: "Actualizado correctamente.", type });
    } catch (error) {
        next(error);
    }
}

async function deleteTreatmentType(req, res, next) {
    try {
        const deleted = await TreatmentType.destroy({ where: { idTipoTratamiento: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Tipo de tratamiento eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createTreatmentType,
    getTreatmentTypes,
    getTreatmentType,
    updateTreatmentType,
    deleteTreatmentType
};