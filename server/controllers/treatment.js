const Treatment = require("../models/treatment");

async function createTreatment(req, res, next) {
    try {
        const treatment = await Treatment.create(req.body);
        return res.status(201).send(treatment);
    } catch (error) {
        next(error);
    }
}

async function getAllTreatments(req, res, next) {
    try {
        const TreatmentType  = require("../models/treatmentType");
        const TreatmentState = require("../models/treatmentState");
        
        const list = await Treatment.findAll({
            include: [
                { model: TreatmentType,  as: 'TipoTratamiento',   attributes: ['nombre'] },
                { model: TreatmentState, as: 'EstadoTratamiento',  attributes: ['descripcion'] }
            ]
        });
        return res.status(200).send(list);
    } catch (error) {
        next(error);
    }
}

async function getTreatment(req, res, next) {
    try {
        const { id } = req.params;
        const treatment = await Treatment.findByPk(id);
        if (!treatment) return res.status(404).send({ msg: "Tratamiento no encontrado." });
        return res.status(200).send(treatment);
    } catch (error) {
        next(error);
    }
}

async function updateTreatment(req, res, next) {
    try {
        const { id } = req.params;
        const treatment = await Treatment.findByPk(id);
        if (!treatment) return res.status(404).send({ msg: "El tratamiento no existe." });

        await treatment.update(req.body);
        return res.status(200).send({ msg: "Tratamiento actualizado correctamente.", treatment });
    } catch (error) {
        next(error);
    }
}

async function deleteTreatment(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await Treatment.destroy({ where: { idTratamiento: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el tratamiento." });
        return res.status(200).send({ msg: "Tratamiento eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createTreatment,
    getAllTreatments,
    getTreatment,
    updateTreatment,
    deleteTreatment
};