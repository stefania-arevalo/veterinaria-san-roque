const MedicationType = require("../models/medicationType");

async function createMedicationType(req, res, next) {
    try {
        const medicationType = await MedicationType.create(req.body);
        return res.status(201).send(medicationType);
    } catch (error) {
        next(error);
    }
}

async function getMedicationTypes(req, res, next) {
    try {
        const types = await MedicationType.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getMedicationType(req, res, next) {
    try {
        const type = await MedicationType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "Tipo de medicación no encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updateMedicationType(req, res, next) {
    try {
        const type = await MedicationType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "El registro no existe." });

        await type.update(req.body);
        return res.status(200).send({ msg: "Tipo de medicación actualizado.", type });
    } catch (error) {
        next(error);
    }
}

async function deleteMedicationType(req, res, next) {
    try {
        const deleted = await MedicationType.destroy({ where: { idTipoMedicacion: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Tipo de medicación eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createMedicationType,
    getMedicationTypes,
    getMedicationType,
    updateMedicationType,
    deleteMedicationType
};