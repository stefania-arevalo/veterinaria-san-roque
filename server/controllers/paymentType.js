const PaymentType = require("../models/paymentType");

async function createPaymentType(req, res, next) {
    try {
        const type = await PaymentType.create(req.body);
        return res.status(201).send(type);
    } catch (error) {
        next(error);
    }
}

async function getAllPaymentTypes(req, res, next) {
    try {
        const types = await PaymentType.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getPaymentType(req, res, next) {
    try {
        const { id } = req.params;
        const type = await PaymentType.findByPk(id);
        if (!type) return res.status(404).send({ msg: "Tipo de pago no encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updatePaymentType(req, res, next) {
    try {
        const { id } = req.params;
        const type = await PaymentType.findByPk(id);
        if (!type) return res.status(404).send({ msg: "El tipo de pago no existe." });

        if (req.body.descripcion && type.descripcion === req.body.descripcion.trim()) {
            return res.status(400).send({ msg: "No se detectaron cambios en la descripcion." });
        }

        await type.update(req.body);
        return res.status(200).send({ msg: "Tipo de pago actualizado.", type });
    } catch (error) {
        next(error);
    }
}

async function deletePaymentType(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await PaymentType.destroy({ where: { idTipoPago: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el registro." });
        return res.status(200).send({ msg: "Tipo de pago eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPaymentType,
    getAllPaymentTypes,
    getPaymentType,
    updatePaymentType,
    deletePaymentType
};