const PurchaseDetail = require("../models/purchaseDetail");
const Batch = require("../models/batch");
const sequelize = require("../db");

async function createPurchaseDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { idCompra, idProducto, idProductoPresentacion, idLote, cantidad, precioUnidad } = req.body;

        const presentationId = idProductoPresentacion || null;

        const detail = await PurchaseDetail.create({
            idCompra,
            idProducto,
            idProductoPresentacion: presentationId, 
            idLote,
            cantidad,
            precioUnidad
        }, { transaction: t });

        // Sumar al stock del lote afectado
        await Batch.increment('cantidadDisponible', {
            by: cantidad,
            where: { idLote: idLote },
            transaction: t
        });

        await t.commit();
        return res.status(201).send(detail);
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}



async function getAllDetails(req, res, next) {
    try {
        const details = await PurchaseDetail.findAll();
        return res.status(200).send(details);
    } catch (error) {
        next(error);
    }
}

async function getDetail(req, res, next) {
    try {
        const detail = await PurchaseDetail.findByPk(req.params.id);
        if (!detail) return res.status(404).send({ msg: "Detalle no encontrado." });
        return res.status(200).send(detail);
    } catch (error) {
        next(error);
    }
}

async function updatePurchaseDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { cantidad: nuevaCantidad, idProductoPresentacion } = req.body;

        const detail = await PurchaseDetail.findByPk(id, { transaction: t });
        if (!detail) {
            await t.rollback();
            return res.status(404).send({ msg: "Detalle no encontrado." });
        }

        // Si mandan variantes, normalizamos el objeto req.body hacia lo que el modelo entiende
        const presentationId = idProductoPresentacion;
        if (presentationId !== undefined) {
            req.body.idProductoPresentacion = presentationId || null;
            if (req.body.idProductoPresentacion) delete req.body.idProductoPresentacion;
        }

        let hasChanges = false;
        for (let key in req.body) {
            if (detail[key] !== req.body[key]) {
                hasChanges = true;
                break;
            }
        }

        if (!hasChanges) {
            await t.rollback();
            return res.status(200).send({ msg: "No se realizaron cambios: los datos enviados son idénticos a los actuales." });
        }

        if (nuevaCantidad !== undefined && Number(nuevaCantidad) !== detail.cantidad) {
            const diferencia = Number(nuevaCantidad) - detail.cantidad;

            await Batch.increment('cantidadDisponible', {
                by: diferencia,
                where: { idLote: detail.idLote },
                transaction: t
            });
        }

        await detail.update(req.body, { transaction: t });
        await t.commit();
        return res.status(200).send({ msg: "Detalle y stock actualizados correctamente.", detail });

    } catch (error) {
        if (t) await t.rollback();
        next(error); 
    }
}

async function deletePurchaseDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const detail = await PurchaseDetail.findByPk(req.params.id, { transaction: t });
        if (!detail) {
            await t.rollback();
            return res.status(404).send({ msg: "No encontrado." });
        }

        await Batch.decrement('cantidadDisponible', {
            by: detail.cantidad,
            where: { idLote: detail.idLote },
            transaction: t
        });

        await detail.destroy({ transaction: t });
        await t.commit();
        return res.status(200).send({ msg: "Detalle eliminado y stock restado del lote." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

module.exports = { 
    createPurchaseDetail, 
    getAllDetails, 
    getDetail, 
    updatePurchaseDetail, 
    deletePurchaseDetail 
};