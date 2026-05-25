const SaleState = require("../models/saleState");

async function createSaleState(req, res, next) {
    try {
        const state = await SaleState.create(req.body);
        return res.status(201).send(state);
    } catch (error) {
        next(error);
    }
}

async function getAllSaleStates(req, res, next) {
    try {
        const states = await SaleState.findAll({ order: [['idEstadoVenta', 'ASC']] });
        return res.status(200).send(states);
    } catch (error) {
        next(error);
    }
}

async function getSaleState(req, res, next) {
    try {
        const { id } = req.params;
        const state = await SaleState.findByPk(id);
        if (!state) return res.status(404).send({ msg: "Estado de venta no encontrado." });
        return res.status(200).send(state);
    } catch (error) {
        next(error);
    }
}

async function updateSaleState(req, res, next) {
    try {
        const { id } = req.params;
        const state = await SaleState.findByPk(id);
        if (!state) return res.status(404).send({ msg: "El estado de venta no existe." });

        if (req.body.descripcion && state.descripcion === req.body.descripcion.trim()) {
            return res.status(400).send({ msg: "No se detectaron cambios en la descripcion." });
        }

        await state.update(req.body);
        return res.status(200).send({ msg: "Estado de venta actualizado correctamente.", state });
    } catch (error) {
        next(error);
    }
}

async function deleteSaleState(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await SaleState.destroy({ where: { idEstadoVenta: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el registro." });
        return res.status(200).send({ msg: "Estado de venta eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createSaleState,
    getAllSaleStates,
    getSaleState,
    updateSaleState,
    deleteSaleState
};