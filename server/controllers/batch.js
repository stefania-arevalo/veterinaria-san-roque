const Batch = require("../models/batch");
const Product = require("../models/product");

async function createBatch(req, res, next) {
    try {
        const batch = await Batch.create(req.body);
        return res.status(201).send(batch);
    } catch (error) {
        next(error);
    }
}

async function getBatches(req, res, next) {
    try {
        const batches = await Batch.findAll({ 
            order: [['fechaVencimiento', 'ASC']],
            include: [
                {
                    model: Product,
                    as: "Producto",
                    attributes: ["nombre"]
                }
            ]
        });
        return res.status(200).send(batches);
    } catch (error) {
        next(error);
    }
}

async function getBatch(req, res, next) {
    try {
        const { id } = req.params;
        const batch = await Batch.findByPk(id, {
            include: [
                {
                    model: Product,
                    as: "Producto",
                    attributes: ["nombre"]
                }
            ]
        });
        if (!batch) return res.status(404).send({ msg: "Lote no encontrado." });
        return res.status(200).send(batch);
    } catch (error) {
        next(error);
    }
}

// NUEVA FUNCIÓN: Obtener lotes por ID de producto
async function getBatchesByProduct(req, res, next) {
    try {
        const { idProducto } = req.params;
        const batches = await Batch.findAll({
            where: { idProducto: idProducto },
            order: [['fechaVencimiento', 'ASC']]
        });
        return res.status(200).send(batches);
    } catch (error) {
        next(error);
    }
}

async function updateBatch(req, res, next) {
    try {
        const { id } = req.params;
        const { cantidadDisponible, fechaVencimiento, codigoLote } = req.body;

        const batch = await Batch.findByPk(id);
        if (!batch) return res.status(404).send({ msg: "Lote no encontrado." });

        const isSame = 
            (cantidadDisponible === undefined || batch.cantidadDisponible === Number(cantidadDisponible)) &&
            (fechaVencimiento === undefined || batch.fechaVencimiento === fechaVencimiento) &&
            (codigoLote === undefined || batch.codigoLote === codigoLote.trim().toUpperCase());

        if (isSame) {
            return res.status(400).send({ msg: "No hay cambios para actualizar en este lote." });
        }

        await batch.update(req.body);
        return res.status(200).send({ msg: "Lote actualizado correctamente.", batch });
    } catch (error) {
        next(error);
    }
}

async function deleteBatch(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await Batch.destroy({ where: { idLote: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Lote no encontrado." });
        return res.status(200).send({ msg: "Lote eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createBatch,
    getBatches,
    getBatch,
    getBatchesByProduct, 
    updateBatch,
    deleteBatch
};