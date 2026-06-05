const sequelize = require("../db");
const Purchase = require("../models/purchase");
const PurchaseDetail = require("../models/purchaseDetail");

const Staff = require("../models/staff");
const Provider = require("../models/provider");
const Visitor = require("../models/visitor");
const PaymentType = require("../models/paymentType");
const ReceiptType = require("../models/receiptType");
const Product = require("../models/product");
const Batch = require("../models/batch");
const ProductPresentation = require("../models/productPresentation");

async function createPurchase(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { fecha, hora, descuento, iva, idPersonal, idProveedor, idVisitador, idTipoPago, idTipoBoleta, items } = req.body;

        // 1. Crear Cabecera de Compra
        const purchase = await Purchase.create({
            fecha, hora, descuento, iva, idPersonal, idProveedor, idVisitador, idTipoPago, idTipoBoleta
        }, { transaction: t });

        // 2. Procesar items y Administrar Lotes/Stock
        if (items && items.length > 0) {
            for (const item of items) {
                // Captura el ID se llame como se llame en el JSON (idProductoPresentacion o idProdPres)
                const presentationId = item.idProductoPresentacion || item.idProdPres || null;

                // Buscamos si ya existe ese lote del fabricante para ese producto y formato exacto
                let lote = await Batch.findOne({
                    where: {
                        codigoLote: item.codigoLote,
                        idProducto: item.idProducto,
                        // Si tu modelo Lotes usa idProd_Pres o idProductoPresentacion, poné la que corresponda
                        idProd_Pres: presentationId 
                    },
                    transaction: t
                });

                if (lote) {
                    // Si ya existe el lote, le incrementamos las unidades físicas
                    lote.cantidadDisponible += Number(item.cantidad);
                    await lote.save({ transaction: t });
                } else {
                    // Si es la primera vez que ingresa este lote al sistema, lo creamos dinámicamente
                    lote = await Batch.create({
                        codigoLote: item.codigoLote,
                        idProducto: item.idProducto,
                        idProd_Pres: presentationId,
                        fechaVencimiento: item.fechaVencimiento,
                        cantidadDisponible: item.cantidad
                    }, { transaction: t });
                }

                let prodPres = await ProductPresentation.findOne({
                    where: {
                        idProducto: item.idProducto,
                        idPresentacion: item.idPresentacion // ⚠️ VITAL: tu frontend DEBE enviar idPresentacion en el itemsPayload
                    },
                    transaction: t
                });
                
                if (prodPres) {
                    // Si existe, le actualizamos el precio de venta con el nuevo valor
                    prodPres.precio = item.precioVentaPublico;
                    await prodPres.save({ transaction: t });
                } else {
                    // Si NO existe (ej: producto nuevo), lo creamos desde cero
                    prodPres = await ProductPresentation.create({
                        idProducto: item.idProducto,
                        idPresentacion: item.idPresentacion,
                        precio: item.precioVentaPublico
                    }, { transaction: t });
                }

                // 3. Creamos el detalle de la compra alineado 100% al modelo PurchaseDetail
                await PurchaseDetail.create({
                    idCompra: purchase.idCompra,
                    idProducto: item.idProducto,
                    idProductoPresentacion: presentationId, // 🌟 Coincide EXACTO con tu modelo
                    idLote: lote.idLote,
                    cantidad: item.cantidad,
                    precioUnidad: item.precioUnidad
                }, { transaction: t });
            }
        }

        await t.commit();
        return res.status(201).send(purchase);

    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function getAllPurchases(req, res, next) {
    try {
        const { date } = req.query;
        let whereClause = {};
        if (date) whereClause.fecha = date;

        const purchases = await Purchase.findAll({
            where: whereClause,
            include: [
                { model: Staff, as: 'Comprador', attributes: ['nombres', 'apellidos'] },
                { model: Provider, as: 'Proveedor', attributes: ['razonSocial', 'cuit'] },
                { model: Visitor, as: 'Visitador', attributes: ['nombre', 'apellido'] },
                { model: PaymentType, as: 'FormaPago' },
                { model: ReceiptType, as: 'TipoComprobante' },
                { 
                    model: PurchaseDetail, 
                    as: 'detalles',
                    include: [
                        { model: Product, as: 'Producto', attributes: ['nombre'] },
                        { model: Batch, as: 'Lote', attributes: ['codigoLote', 'cantidadDisponible', 'fechaVencimiento'] },
                        { model: ProductPresentation, as: 'Presentacion', attributes: ['precio'] }
                    ]
                }
            ],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        return res.status(200).send(purchases);
    } catch (error) {
        next(error);
    }
}

async function getPurchase(req, res, next) {
    try {
        const purchase = await Purchase.findByPk(req.params.id, {
            include: [{ model: PurchaseDetail, as: 'detalles' }]
        });
        if (!purchase) return res.status(404).send({ msg: "Compra no encontrada." });
        return res.status(200).send(purchase);
    } catch (error) {
        next(error);
    }
}

async function updatePurchase(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id, { transaction: t });
        
        if (!purchase) {
            await t.rollback();
            return res.status(404).send({ msg: "No se encontró la compra en la base de datos." });
        }

        const [updated] = await Purchase.update(req.body, { 
            where: { idCompra: id },
            transaction: t 
        });
        
        if (updated === 0) {
            await t.commit();
            return res.status(200).send({ 
                msg: "No se realizaron cambios porque los datos enviados son idénticos a los actuales." 
            });
        }

        await t.commit();
        return res.status(200).send({ msg: "Edición Completada." });

    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function deletePurchase(req, res, next) { 
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id, { transaction: t });
        if (!purchase) {
            const error = new Error("Compra no encontrada.");
            error.status = 404; 
            throw error;
        }

        const detalles = await PurchaseDetail.findAll({ where: { idCompra: id }, transaction: t });
        
        for (const det of detalles) {
            await Batch.decrement('cantidadDisponible', { 
                by: det.cantidad, 
                where: { idLote: det.idLote }, 
                transaction: t 
            });
        }

        await PurchaseDetail.destroy({ where: { idCompra: id }, transaction: t });
        await Purchase.destroy({ where: { idCompra: id }, transaction: t });
        
        await t.commit();
        return res.status(200).send({ msg: "Compra eliminada y stock revertido." });
        
    } catch (error) {
        if (t) await t.rollback();
        next(error); 
    }
}

module.exports = { createPurchase, getAllPurchases, getPurchase, updatePurchase, deletePurchase };