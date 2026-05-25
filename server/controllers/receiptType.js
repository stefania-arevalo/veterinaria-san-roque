const ReceiptType = require("../models/receiptType");

async function createReceiptType(req, res, next) {
    try {
        const type = await ReceiptType.create(req.body);
        return res.status(201).send(type);
    } catch (error) {
        next(error);
    }
}

async function getAllReceiptTypes(req, res, next) {
    try {
        const types = await ReceiptType.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getReceiptType(req, res, next) {
    try {
        const { id } = req.params;
        const type = await ReceiptType.findByPk(id);
        if (!type) return res.status(404).send({ msg: "Tipo de boleta no encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updateReceiptType(req, res, next) {
    try {
        const { id } = req.params;
        const type = await ReceiptType.findByPk(id);
        if (!type) return res.status(404).send({ msg: "El tipo de boleta no existe." });

        let hasChanges = false;
        if (req.body.descripcion && type.descripcion !== req.body.descripcion.trim()) {
            hasChanges = true;
        }

        if (!hasChanges) {
            return res.status(400).send({ msg: "No se detectaron cambios para actualizar." });
        }

        await type.update(req.body);
        return res.status(200).send({ msg: "Tipo de boleta actualizado correctamente.", type });
    } catch (error) {
        next(error);
    }
}

async function deleteReceiptType(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await ReceiptType.destroy({ where: { idTipoBoleta: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el registro." });
        return res.status(200).send({ msg: "Tipo de boleta eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createReceiptType,
    getAllReceiptTypes,
    getReceiptType,
    updateReceiptType,
    deleteReceiptType
};