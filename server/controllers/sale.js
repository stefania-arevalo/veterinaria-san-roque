const { Op } = require("sequelize");
const sequelize = require("../db");
const Sale = require("../models/sale");
const SaleDetail = require("../models/saleDetail");
const Staff = require("../models/staff");
const Client = require("../models/client");
const PaymentType = require("../models/paymentType");
const ReceiptType = require("../models/receiptType");
const SaleState = require("../models/saleState");
const Product = require("../models/product");
const Batch = require("../models/batch");
const ProductPresentation = require("../models/productPresentation");
const AppointmentDetail = require("../models/appointmentDetail");
const ServicePrice = require("../models/servicePrice");
const Service = require("../models/service"); 
const Appointment = require("../models/appointment"); 
const Pet = require("../models/pet");
const TreatmentMedication = require("../models/treatmentMedication");
const AppliedVaccine = require("../models/appliedVaccine"); // ajustá la ruta según tu proyecto
const { checkAndAlertStock } = require("../services/stockService");

async function createSale(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { idCliente, idTipoPago, idTipoBoleta, descuento = 0, items } = req.body;

        // Buscar el idPersonal desde el usuario autenticado
        const personal = await Staff.findOne({ 
            where: { idUsuario: req.user.user_id }, 
            transaction: t 
        });
        if (!personal) {
            await t.rollback();
            return res.status(400).send({ msg: "El usuario no tiene un perfil de personal asociado." });
        }
        const idPersonal = personal.idPersonal;
        
        let subtotalAcumulado = 0;
        const detallesParaCrear = [];

        // 1. Procesar cada item para obtener precios reales de la BD
        for (const item of items) {
            let precioUnitario = 0;

            if (item.idProducto) {
                // ── Producto de venta libre ──────────────────────────────
                const prod = await ProductPresentation.findOne({ 
                    where: { idProducto: item.idProducto }, 
                    transaction: t 
                });
                if (!prod) throw new Error(`Producto ID ${item.idProducto} no encontrado.`);
                precioUnitario = parseFloat(prod.precio);
        
                if (item.idLote) {
                    const lote = await Batch.findByPk(item.idLote, { transaction: t });
                    if (!lote || lote.cantidadDisponible < item.cantidad) {
                        throw new Error(`Stock insuficiente para el producto ID ${item.idProducto}`);
                    }
                    if (lote.fechaVencimiento && new Date(lote.fechaVencimiento) <= new Date()) {
                        throw new Error(`El lote seleccionado para el producto ID ${item.idProducto} se encuentra vencido y no puede venderse.`);
                    }
                    await Batch.decrement('cantidadDisponible', { 
                        by: item.cantidad, 
                        where: { idLote: item.idLote }, 
                        transaction: t 
                    });
                }
        
            } else if (item.idDetalleCitaServicio) {
                // ── Servicio de cita ─────────────────────────────────────
                const detCita = await AppointmentDetail.findByPk(item.idDetalleCitaServicio, {
                    include: [{ model: ServicePrice, as: 'PrecioServicio' }],
                    transaction: t
                });
                if (!detCita) throw new Error("Servicio de cita no encontrado.");
                precioUnitario = parseFloat(detCita.PrecioServicio.precio);
        
                await detCita.update({ idEstadoServicio: 5 }, { transaction: t });
        
                const serviciosPendientes = await AppointmentDetail.count({
                    where: {
                        idCita: detCita.idCita,
                        idEstadoServicio: { [Op.ne]: 5 }
                    },
                    transaction: t
                });
        
                if (serviciosPendientes === 0) {
                    await Appointment.update(
                        { idEstadoCita: 4 }, 
                        { where: { idCita: detCita.idCita }, transaction: t }
                    );
                }
        
            } else if (item.idTratMed) {
                // ── Medicamento/vacuna de tratamiento ────────────────────
                const tratMed = await TreatmentMedication.findByPk(item.idTratMed, { 
                    transaction: t 
                });
                if (!tratMed) throw new Error(`Medicamento de tratamiento ID ${item.idTratMed} no encontrado.`);
                
                precioUnitario = parseFloat(tratMed.precioAplicado);
        
                // Solo descontamos stock si el producto NO fue aplicado en clínica
                // (aplicadoEnClinica === 0 significa que el cliente lo lleva a casa)
                if (!tratMed.aplicadoEnClinica && item.idLote) {
                    const lote = await Batch.findByPk(item.idLote, { transaction: t });
                    if (!lote || lote.cantidadDisponible < item.cantidad) {
                        throw new Error(`Stock insuficiente para el medicamento ID ${item.idTratMed}`);
                    }
                    if (lote.fechaVencimiento && new Date(lote.fechaVencimiento) <= new Date()) {
                        throw new Error(`El medicamento seleccionado se encuentra vencido y no puede venderse.`);
                    }
                    await Batch.decrement('cantidadDisponible', { 
                        by: item.cantidad, 
                        where: { idLote: item.idLote }, 
                        transaction: t 
                    });
                }
                // Si aplicadoEnClinica === 1: solo se cobra, el stock ya fue descontado
                // cuando el veterinario lo registró en el tratamiento.
            } else if (item.idVacunaAplicada) {
                // ── Vacuna aplicada en consulta (ID desde VACUNAS_APLICADAS) ──
                const vacAplicada = await AppliedVaccine.findByPk(item.idVacunaAplicada, { transaction: t });
                
                if (!vacAplicada) throw new Error(`Vacuna aplicada ID ${item.idVacunaAplicada} no encontrada.`);
                if (vacAplicada.cobrada) throw new Error(`La vacuna ID ${item.idVacunaAplicada} ya fue cobrada.`);
    
                // Usamos el precio que congelamos al momento de aplicar la dosis
                precioUnitario = parseFloat(vacAplicada.precioAplicado || 0);
    
                // Marcamos como cobrada para que no aparezca más en la lista de pendientes
                // El stock NO se toca porque ya lo descontó el veterinario al aplicar
                await vacAplicada.update({ cobrada: 1 }, { transaction: t });
            }
            // ↑↑↑ FIN DEL NUEVO BLOQUE ↑↑↑
    
            subtotalAcumulado += precioUnitario * item.cantidad;
            
            detallesParaCrear.push({
                idProducto:            item.idProducto            || null,
                idDetalleCitaServicio: item.idDetalleCitaServicio || null,
                idTratMed:             item.idTratMed             || null,
                idVacunaAplicada:      item.idVacunaAplicada      || null, // No olvides agregar esto
                idLote:                item.idLote                || null,
                cantidad:              item.cantidad,
                precioUnidad:          precioUnitario
            });
        
        }

        // 2. Cálculos finales (IVA 21%)
        const IVA_PORCENTAJE = 0.21; 
        const montoIva = subtotalAcumulado * IVA_PORCENTAJE;
        const totalFinal = (subtotalAcumulado + montoIva) - parseFloat(descuento);

        // 3. Crear la Cabecera de la Venta (ID: 1 - Completada/Activa)
        const nuevaVenta = await Sale.create({
            fecha: req.body.fecha,
            hora: req.body.hora,
            descuento: descuento,
            iva: montoIva,
            total: totalFinal,
            idPersonal,
            idCliente,
            idTipoPago,
            idTipoBoleta,
            idEstadoVenta: 1 
        }, { transaction: t });

        // 4. Crear los detalles vinculados a la venta
        const detallesFinales = detallesParaCrear.map(d => ({
            ...d,
            idVenta: nuevaVenta.idVenta
        }));

        await SaleDetail.bulkCreate(detallesFinales, { transaction: t });

        await t.commit();
        return res.status(201).send(nuevaVenta);

    } catch (error) {
        if (t) await t.rollback();
        res.status(400).send({ msg: error.message });
    }
}

async function getAllSales(req, res, next) {
    try {
        const { date } = req.query;
        let whereClause = {};
        if (date) whereClause.fecha = date;

        const sales = await Sale.findAll({
            where: whereClause,
            include: [
                { model: Staff, as: 'Vendedor', attributes: ['nombres', 'apellidos'] },
                { model: Client, as: 'Cliente', attributes: ['nombres', 'apellidos'] },
                { model: PaymentType, as: 'FormaPago' },
                { model: ReceiptType, as: 'TipoComprobante' },
                { model: SaleState, as: 'EstadoVenta' },
                { 
                    model: SaleDetail, 
                    as: 'detalles',
                    include: [
                        { model: Product, as: 'Producto', attributes: ['nombre'] },
                        { 
                            model: Batch, 
                            as: 'Lote', 
                            attributes: ['idLote', 'codigoLote'],
                            required: false
                        },
                        { 
                            model: AppointmentDetail, 
                            as: 'DetalleCita', 
                            include: [
                                {
                                    model: ServicePrice,
                                    as: 'PrecioServicio',
                                    include: [{ model: Service, as: 'Service', attributes: ['descripcion'] }]
                                },
                                {
                                    model: Appointment,
                                    as: 'Cita',
                                    include: [{ model: Pet, as: 'Mascota', attributes: ['nombre'] }]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        return res.status(200).send(sales);
    } catch (error) {
        next(error);
    }
}
async function getSale(req, res, next) {
    try {
        const sale = await Sale.findByPk(req.params.id, {
            include: [{ model: SaleDetail, as: 'detalles' }]
        });
        if (!sale) return res.status(404).send({ msg: "Venta no encontrada." });
        return res.status(200).send(sale);
    } catch (error) {
        next(error);
    }
}

async function updateSale(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        
        // Verificamos el estado actual
        const sale = await Sale.findByPk(id, { transaction: t });
        if (!sale) {
             await t.rollback();
             return res.status(404).send({ msg: "Venta no encontrada." });
        }
        
        // Bloqueo: Si está anulada (3), no se permite edición
        if (sale.idEstadoVenta === 3) {
            await t.rollback();
            return res.status(403).send({ msg: "No se puede editar una venta anulada." });
        }

        const [updated] = await Sale.update(req.body, { 
            where: { idVenta: id },
            transaction: t 
        });

        if (updated === 0) {
            await t.rollback();
            return res.status(404).send({ msg: "No se realizaron cambios." });
        }

        await t.commit();
        return res.status(200).send({ msg: "Edición Completada." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function deleteSale(req, res, next) {
    const t = await sequelize.transaction();
    try {
        // Buscamos la venta con sus detalles actuales
        const sale = await Sale.findByPk(req.params.id, {
            include: [{ model: SaleDetail, as: 'detalles' }],
            transaction: t
        });

        if (!sale) throw new Error("La venta que intenta anular no existe.");
        if (sale.idEstadoVenta === 3) throw new Error("Esta venta ya se encuentra anulada.");

        // Procesamos solo los detalles que tiene la venta en este momento
        if (sale.detalles && sale.detalles.length > 0) {
            for (const det of sale.detalles) {
                
                // Si es producto, devolvemos stock al lote
                if (det.idLote) {
                    await Batch.increment('cantidadDisponible', { 
                        by: det.cantidad, 
                        where: { idLote: det.idLote }, 
                        transaction: t 
                    });
                }

                // Si es servicio, lo regresamos a estado 3 (Por cobrar)
                if (det.idDetalleCitaServicio) {
                    await AppointmentDetail.update(
                        { idEstadoServicio: 3 }, 
                        { 
                            where: { idDetalle: det.idDetalleCitaServicio }, 
                            transaction: t 
                        }
                    );
                }

                // Si es medicamento de tratamiento para llevar, devolvemos stock
                if (det.idTratMed && det.idLote) {
                    const tratMed = await TreatmentMedication.findByPk(det.idTratMed, { transaction: t });
                    // Solo revertimos si el stock fue descontado en la venta (no aplicado en clínica)
                    if (tratMed && !tratMed.aplicadoEnClinica) {
                        await Batch.increment('cantidadDisponible', { 
                            by: det.cantidad, 
                            where: { idLote: det.idLote }, 
                            transaction: t 
                        });
                    }
                }
                
                // Si es una vacuna aplicada en consulta, revertimos el estado 'cobrada'
                if (det.idVacunaAplicada) {
                    const AppliedVaccine = require("../models/appliedVaccine"); // Asegúrate de tener el modelo
                    await AppliedVaccine.update(
                        { cobrada: 0 }, 
                        { 
                            where: { idVacunaAplicada: det.idVacunaAplicada }, 
                            transaction: t 
                        }
                    );
                }
            }
        }

        // NO BORRAMOS, cambiamos el estado a 3 (Anulada)
        await sale.update({ idEstadoVenta: 3 }, { transaction: t });

        await t.commit();
        return res.status(200).send({ 
            msg: "Venta ANULADA exitosamente.", 
            detalle: "Se ha restaurado el stock y los servicios han vuelto a estado 'Por cobrar'." 
        });

    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function getMySales(req, res, next) {
    try {
        // Buscar el cliente vinculado al usuario autenticado
        const client = await Client.findOne({ where: { idUsuario: req.user.user_id } });
        if (!client) return res.status(200).send([]);

        const sales = await Sale.findAll({
            where: {
                idCliente: client.idCliente,
                idEstadoVenta: { [Op.ne]: 3 } // excluir anuladas
            },
            include: [
                { model: PaymentType,  as: "FormaPago" },
                { model: ReceiptType,  as: "TipoComprobante" },
                { model: SaleState,    as: "EstadoVenta" },
                {
                    model: SaleDetail, as: "detalles",
                    include: [
                        { model: Product, as: "Producto", attributes: ["nombre"] },
                        {
                            model: AppointmentDetail, as: "DetalleCita",
                            include: [{
                                model: ServicePrice, as: "PrecioServicio",
                                include: [{ model: Service, as: "Service", attributes: ["descripcion"] }]
                            }]
                        }
                    ]
                }
            ],
            order: [["fecha", "DESC"], ["hora", "DESC"]]
        });

        return res.status(200).send(sales);
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createSale, 
    getAllSales, 
    getSale, 
    updateSale, 
    deleteSale,
    getMySales
};