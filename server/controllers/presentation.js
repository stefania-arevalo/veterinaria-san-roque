const Presentation = require("../models/presentation");

async function createPresentation(req, res, next) {
    try {
        const presentation = await Presentation.create(req.body);
        return res.status(201).send(presentation);
    } catch (error) {
        next(error);
    }
}

async function getPresentations(req, res, next) {
    try {
        const list = await Presentation.findAll({ where: { activo: true } });
        return res.status(200).send(list);
    } catch (error) {
        next(error);
    }
}

async function getPresentation(req, res, next) {
    try {
        const presentation = await Presentation.findOne({ where: { idPresentacion: req.params.id, activo: true } });
        if (!presentation) return res.status(404).send({ msg: "Presentación no encontrada." });
        return res.status(200).send(presentation);
    } catch (error) {
        next(error);
    }
}

async function updatePresentation(req, res, next) {
    try {
        const presentation = await Presentation.findByPk(req.params.id);
        if (!presentation || !presentation.activo) return res.status(404).send({ msg: "No existe el registro." });

        await presentation.update(req.body);
        return res.status(200).send({ msg: "Presentación actualizada.", presentation });
    } catch (error) {
        next(error);
    }
}

async function deletePresentation(req, res, next) {
    try {
        // Soft delete: update en lugar de destroy
        const updated = await Presentation.update({ activo: false }, { where: { idPresentacion: req.params.id } });
        if (updated[0] === 0) return res.status(404).send({ msg: "No encontrado o ya desactivado." });
        return res.status(200).send({ msg: "Presentación desactivada." });
    } catch (error) { next(error); }
}

module.exports = {
    createPresentation,
    getPresentations,
    getPresentation,
    updatePresentation,
    deletePresentation
};