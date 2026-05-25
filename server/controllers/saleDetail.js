const SaleDetail = require("../models/saleDetail");
const Sale = require("../models/sale");
const Batch = require("../models/batch");
const ProductPresentation = require("../models/productPresentation");
const AppointmentDetail = require("../models/appointmentDetail");
const ServicePrice = require("../models/servicePrice");
const sequelize = require("../db");

async function createSaleDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { idVenta, idProducto, idDetalleCitaServicio, idLote, cantidad } = req.body;
        let precioFinal = 0;

        // 1. Validar Venta
        const sale = await Sale.findByPk(idVenta, { transaction: t });
        if (!sale) throw new Error("Venta no encontrada.");
        if (sale.idEstadoVenta === 3) throw new Error("Venta anulada.");

        // 2. Lógica de Producto
        if (idProducto) {
            const prodPres = await ProductPresentation.findOne({ where: { idProducto }, transaction: t });
            if (!prodPres) throw new Error("Precio de producto no definido.");
            precioFinal = prodPres.precio;

            if (idLote) {
                const lote = await Batch.findByPk(idLote, { transaction: t });
                if (!lote || lote.cantidadDisponible < cantidad) throw new Error("Stock insuficiente.");
                await Batch.decrement('cantidadDisponible', { by: cantidad, where: { idLote }, transaction: t });
            }
        } 
        // 3. Lógica de Servicio
        else if (idDetalleCitaServicio) {
            const detCita = await AppointmentDetail.findByPk(idDetalleCitaServicio, {
                include: [{ model: ServicePrice, as: 'PrecioServicio' }],
                transaction: t
            });
            if (!detCita) throw new Error("Servicio no encontrado.");
            precioFinal = detCita.PrecioServicio.precio;
            
            // Actualizar estado del servicio a pagado
            await detCita.update({ idEstadoServicio: 5 }, { transaction: t });
        }

        // 4. CREACIÓN EFECTIVA DEL REGISTRO
        const detail = await SaleDetail.create({
            idVenta, 
            idProducto: idProducto || null, 
            idDetalleCitaServicio: idDetalleCitaServicio || null, 
            idLote: idLote || null, 
            cantidad, 
            precioUnidad: precioFinal
        }, { transaction: t });

        await t.commit();
        return res.status(201).send(detail);
    } catch (error) {
        if (t) await t.rollback();
        res.status(400).send({ msg: error.message });
    }
}

async function getAllDetails(req, res, next) {
    try {
        const details = await SaleDetail.findAll();
        return res.status(200).send(details);
    } catch (error) {
        next(error);
    }
}

async function getDetail(req, res, next) {
    try {
        const detail = await SaleDetail.findByPk(req.params.id);
        if (!detail) return res.status(404).send({ msg: "Detalle no encontrado." });
        return res.status(200).send(detail);
    } catch (error) {
        next(error);
    }
}

async function updateSaleDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { cantidad: nuevaCantidad, idDetalleCitaServicio } = req.body;

        // ✅ Primero buscamos el detalle para obtener su idVenta
        const detail = await SaleDetail.findByPk(id, { transaction: t });
        if (!detail) throw new Error("Registro de detalle no encontrado.");

        // ✅ Ahora sí validamos la venta usando detail.idVenta
        const sale = await Sale.findByPk(detail.idVenta, { transaction: t });
        if (!sale) {
            await t.rollback();
            return res.status(404).send({ msg: "Venta no encontrada." });
        }

        if (sale.idEstadoVenta === 3) {
            await t.rollback();
            return res.status(403).send({ msg: "No se pueden editar detalles de una venta anulada." });
        }

        // Bloqueo edición de servicio
        if (idDetalleCitaServicio) {
            throw new Error("No está permitido cambiar el servicio. Eliminá el detalle y creá uno nuevo.");
        }

        // Ajuste de stock si cambia la cantidad
        if (nuevaCantidad !== undefined && parseInt(nuevaCantidad) !== detail.cantidad && detail.idLote) {
            const diff = parseInt(nuevaCantidad) - detail.cantidad;
            const lote = await Batch.findByPk(detail.idLote, { transaction: t });

            if (diff > 0) {
                if (lote.cantidadDisponible < diff) throw new Error("Stock insuficiente.");
                await Batch.decrement('cantidadDisponible', { by: diff, where: { idLote: detail.idLote }, transaction: t });
            } else {
                await Batch.increment('cantidadDisponible', { by: Math.abs(diff), where: { idLote: detail.idLote }, transaction: t });
            }
        }

        await detail.update(req.body, { transaction: t });
        await t.commit();
        return res.status(200).send({ msg: "Actualización exitosa", detail });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function deleteSaleDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const detail = await SaleDetail.findByPk(req.params.id, { transaction: t });
        if (!detail) throw new Error("El detalle no existe.");

        // Restaurar Stock
        if (detail.idLote) {
            await Batch.increment('cantidadDisponible', { by: detail.cantidad, where: { idLote: detail.idLote }, transaction: t });
        }

        // Restaurar Estado del Servicio a "Por cobrar" (3)
        if (detail.idDetalleCitaServicio) {
            await AppointmentDetail.update(
                { idEstadoServicio: 3 }, 
                { where: { idDetalle: detail.idDetalleCitaServicio }, transaction: t }
            );
        }

        await detail.destroy({ transaction: t });
        await t.commit();
        return res.status(200).send({ msg: "Renglón eliminado. Stock y servicios restaurados." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

module.exports = { 
    createSaleDetail, 
    getAllDetails, 
    getDetail, 
    updateSaleDetail, 
    deleteSaleDetail 
};