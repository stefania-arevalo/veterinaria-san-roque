// controllers/reports.js
// Endpoint único: GET /api/V1/reports?tab=turnos&desde=2026-05-01&hasta=2026-05-31

const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../db");

const Appointment      = require("../models/appointment");
const AppointmentDetail= require("../models/appointmentDetail");
const AppointmentState = require("../models/appointmentState");
const AppointmentType  = require("../models/appointmentType");
const ServicePrice     = require("../models/servicePrice");
const Service          = require("../models/service");
const Staff            = require("../models/staff");
const Pet              = require("../models/pet");
const Breed            = require("../models/breed");
const Species          = require("../models/species");
const Client           = require("../models/client");
const Sale             = require("../models/sale");
const SaleDetail       = require("../models/saleDetail");
const Product          = require("../models/product");
const Batch            = require("../models/batch");
const PaymentType      = require("../models/paymentType");
const ClinicalHistory  = require("../models/clinicalHistory");
const Veterinarian     = require("../models/veterinarian");

// ─── Helpers ────────────────────────────────────────────────────────────────
function buildDateWhere(campo, desde, hasta) {
    if (!desde && !hasta) return {};
    if (desde && hasta) return { [campo]: { [Op.between]: [desde, hasta] } };
    if (desde) return { [campo]: { [Op.gte]: desde } };
    return { [campo]: { [Op.lte]: hasta } };
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTE: TURNOS
// ══════════════════════════════════════════════════════════════════════════════
async function reporteTurnos(desde, hasta) {
    const where = buildDateWhere("fecha", desde, hasta);

    // Todas las citas del período
    const citas = await Appointment.findAll({
        where,
        include: [
            { model: Staff, as: "Veterinario", attributes: ["nombres", "apellidos"] },
            { model: Pet,   as: "Mascota",     attributes: ["nombre", "idRaza"],
              include: [
                { model: Breed,   as: "Raza",    attributes: ["nombre", "idEspecie"],
                  include: [{ model: Species, as: "Especie", attributes: ["nombre"] }]
                },
                { model: Client, as: "Dueño",   attributes: ["nombres", "apellidos"] }
              ]
            },
            { model: AppointmentState, as: "EstadoCita", attributes: ["descripcion"] },
            { model: AppointmentType,  as: "TipoCita",   attributes: ["descripcion"] },
        ],
        order: [["fecha", "DESC"], ["hora", "ASC"]],
        raw: false
    });

    const total       = citas.length;
    const completados = citas.filter(c => c.idEstadoCita === 4).length; // Finalizada
    const cancelados  = citas.filter(c => c.idEstadoCita === 3).length;
    const pendientes  = citas.filter(c => [1, 2].includes(c.idEstadoCita)).length;
    const ausentes    = citas.filter(c => c.idEstadoCita === 5).length;

    // Turnos por veterinario
    const porVeterinario = {};
    citas.forEach(c => {
        const nombre = c.Veterinario
            ? `${c.Veterinario.nombres} ${c.Veterinario.apellidos}`
            : "Sin asignar";
        porVeterinario[nombre] = (porVeterinario[nombre] || 0) + 1;
    });

    // Turnos por día de la semana
    const diasNombres = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const porDia = { Dom: 0, Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0 };
    citas.forEach(c => {
        const partes = c.fecha.split("-");
        const fecha  = new Date(partes[0], partes[1] - 1, partes[2]);
        const dia    = diasNombres[fecha.getDay()];
        porDia[dia]  = (porDia[dia] || 0) + 1;
    });

    // Turnos por tipo de cita
    const porTipo = {};
    citas.forEach(c => {
        const tipo = c.TipoCita?.descripcion || "Sin tipo";
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    // Especie más atendida
    const porEspecie = {};
    citas.forEach(c => {
        const esp = c.Mascota?.Raza?.Especie?.nombre || "Sin especie";
        porEspecie[esp] = (porEspecie[esp] || 0) + 1;
    });

    // Tabla detalle (últimas 50)
    const detalle = citas.slice(0, 50).map(c => ({
        idCita:      c.idCita,
        fecha:       c.fecha,
        hora:        c.hora?.substring(0, 5),
        mascota:     c.Mascota?.nombre || "—",
        especie:     c.Mascota?.Raza?.Especie?.nombre || "—",
        dueño:       c.Mascota?.Dueño
                       ? `${c.Mascota.Dueño.nombres} ${c.Mascota.Dueño.apellidos}`
                       : "—",
        veterinario: c.Veterinario
                       ? `${c.Veterinario.nombres} ${c.Veterinario.apellidos}`
                       : "—",
        tipo:        c.TipoCita?.descripcion  || "—",
        estado:      c.EstadoCita?.descripcion || "—",
        idEstado:    c.idEstadoCita
    }));

    return {
        kpis: { total, completados, cancelados, pendientes, ausentes,
                tasaAsistencia: total > 0 ? Math.round((completados / total) * 100) : 0 },
        porVeterinario,
        porDia,
        porTipo,
        porEspecie,
        detalle
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTE: VENTAS
// ══════════════════════════════════════════════════════════════════════════════
async function reporteVentas(desde, hasta) {
    const where = buildDateWhere("fecha", desde, hasta);

    const ventas = await Sale.findAll({
        where,
        include: [
            { model: Staff,       as: "Vendedor",        attributes: ["nombres", "apellidos"] },
            { model: Client,      as: "Cliente",         attributes: ["nombres", "apellidos"] },
            { model: PaymentType, as: "FormaPago",       attributes: ["descripcion"] },
            {
                model: SaleDetail, as: "detalles",
                include: [
                    { model: Product, as: "Producto", attributes: ["nombre"] }
                ]
            }
        ],
        order: [["fecha", "DESC"]]
    });

    // Solo ventas activas (idEstadoVenta !== 3)
    const activas   = ventas.filter(v => v.idEstadoVenta !== 3);
    const anuladas  = ventas.filter(v => v.idEstadoVenta === 3).length;
    const ingresos  = activas.reduce((acc, v) => acc + parseFloat(v.total || 0), 0);
    const descuentos = activas.reduce((acc, v) => acc + parseFloat(v.descuento || 0), 0);

    // Por forma de pago
    const porFormaPago = {};
    activas.forEach(v => {
        const forma = v.FormaPago?.descripcion || "Sin especificar";
        porFormaPago[forma] = (porFormaPago[forma] || 0) + parseFloat(v.total || 0);
    });

    // Por vendedor
    const porVendedor = {};
    activas.forEach(v => {
        const nombre = v.Vendedor
            ? `${v.Vendedor.nombres} ${v.Vendedor.apellidos}`
            : "Sin asignar";
        porVendedor[nombre] = (porVendedor[nombre] || 0) + parseFloat(v.total || 0);
    });

    // Ingresos por día (agrupados)
    const porFecha = {};
    activas.forEach(v => {
        porFecha[v.fecha] = (porFecha[v.fecha] || 0) + parseFloat(v.total || 0);
    });

    // Productos más vendidos (por cantidad)
    const productosMap = {};
    activas.forEach(v => {
        (v.detalles || []).forEach(d => {
            if (d.idProducto && d.Producto) {
                const nombre = d.Producto.nombre;
                if (!productosMap[nombre]) productosMap[nombre] = { cantidad: 0, total: 0 };
                productosMap[nombre].cantidad += d.cantidad;
                productosMap[nombre].total    += parseFloat(d.precioUnidad || 0) * d.cantidad;
            }
        });
    });
    const topProductos = Object.entries(productosMap)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 5)
        .map(([nombre, datos]) => ({ nombre, ...datos }));

    // Tabla detalle (últimas 50)
    const detalle = ventas.slice(0, 50).map(v => ({
        idVenta:   v.idVenta,
        fecha:     v.fecha,
        hora:      v.hora?.substring(0, 5),
        cliente:   v.Cliente
                     ? `${v.Cliente.nombres} ${v.Cliente.apellidos}`
                     : "Mostrador",
        vendedor:  v.Vendedor
                     ? `${v.Vendedor.nombres} ${v.Vendedor.apellidos}`
                     : "—",
        formaPago: v.FormaPago?.descripcion || "—",
        total:     parseFloat(v.total || 0),
        descuento: parseFloat(v.descuento || 0),
        estado:    v.idEstadoVenta === 3 ? "Anulada" : "Activa",
        idEstado:  v.idEstadoVenta,
        items:     (v.detalles || []).length
    }));

    return {
        kpis: {
            totalVentas:   activas.length,
            anuladas,
            ingresos:      Math.round(ingresos * 100) / 100,
            descuentos:    Math.round(descuentos * 100) / 100,
            ticketPromedio: activas.length > 0
                            ? Math.round((ingresos / activas.length) * 100) / 100
                            : 0
        },
        porFormaPago,
        porVendedor,
        porFecha,
        topProductos,
        detalle
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTE: CLÍNICO (Historial clínico)
// ══════════════════════════════════════════════════════════════════════════════
async function reporteClinico(desde, hasta) {
    // Para historial usamos la fecha de la cita asociada
    const historiales = await ClinicalHistory.findAll({
        include: [
            {
                model: Appointment, as: "Cita",
                attributes: ["fecha", "hora"],
                where: buildDateWhere("fecha", desde, hasta),
                required: true,
                include: [
                    {
                        model: Pet, as: "Mascota",
                        include: [
                            { model: Breed,   as: "Raza",
                              include: [{ model: Species, as: "Especie", attributes: ["nombre"] }]
                            },
                            { model: Client, as: "Dueño", attributes: ["nombres", "apellidos"] }
                        ]
                    }
                ]
            },
            {
                model: Veterinarian, as: "Veterinario",
                attributes: ["idPersonal"],
                include: [{ model: Staff, attributes: ["nombres", "apellidos"] }]
            }
        ],
        order: [[{ model: Appointment, as: "Cita" }, "fecha", "DESC"]]
    });

    // Diagnósticos más frecuentes (texto libre, agrupamos por primeras palabras)
    const diagnosticoMap = {};
    historiales.forEach(h => {
        const diag = (h.diagnostico || "Sin diagnóstico").substring(0, 40).trim();
        diagnosticoMap[diag] = (diagnosticoMap[diag] || 0) + 1;
    });
    const topDiagnosticos = Object.entries(diagnosticoMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([diagnostico, cantidad]) => ({ diagnostico, cantidad }));

    // Especie más atendida
    const porEspecie = {};
    historiales.forEach(h => {
        const esp = h.Cita?.Mascota?.Raza?.Especie?.nombre || "Sin especie";
        porEspecie[esp] = (porEspecie[esp] || 0) + 1;
    });

    // Motivos más frecuentes
    const motivoMap = {};
    historiales.forEach(h => {
        const motivo = (h.motivo || "Sin motivo").substring(0, 40).trim();
        motivoMap[motivo] = (motivoMap[motivo] || 0) + 1;
    });
    const topMotivos = Object.entries(motivoMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([motivo, cantidad]) => ({ motivo, cantidad }));

    // Peso promedio (solo donde está registrado)
    const pesos = historiales.filter(h => h.peso).map(h => parseFloat(h.peso));
    const pesoPromedio = pesos.length > 0
        ? Math.round((pesos.reduce((a, b) => a + b, 0) / pesos.length) * 10) / 10
        : null;

    // Tabla detalle (últimas 50)
    const detalle = historiales.slice(0, 50).map(h => ({
        idHistorial:  h.idHistorial,
        fecha:        h.Cita?.fecha || "—",
        mascota:      h.Cita?.Mascota?.nombre || "—",
        especie:      h.Cita?.Mascota?.Raza?.Especie?.nombre || "—",
        dueño:        h.Cita?.Mascota?.Dueño
                        ? `${h.Cita.Mascota.Dueño.nombres} ${h.Cita.Mascota.Dueño.apellidos}`
                        : "—",
        veterinario:  h.Veterinario?.Staff
                        ? `${h.Veterinario.Staff.nombres} ${h.Veterinario.Staff.apellidos}`
                        : "—",
        motivo:       h.motivo || "—",
        diagnostico:  h.diagnostico || "—",
        peso:         h.peso || null,
        temperatura:  h.temperatura || null
    }));

    return {
        kpis: {
            totalConsultas: historiales.length,
            pesoPromedio,
            especieTop: Object.entries(porEspecie).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"
        },
        topDiagnosticos,
        topMotivos,
        porEspecie,
        detalle
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTE: INVENTARIO (Stock actual, sin filtro de fechas)
// ══════════════════════════════════════════════════════════════════════════════
async function reporteInventario() {
    const lotes = await Batch.findAll({
        include: [
            { model: Product, as: "Producto",
              attributes: ["nombre", "esUsoInterno"] }
        ],
        order: [["fechaVencimiento", "ASC"]]
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en30dias = new Date(hoy);
    en30dias.setDate(en30dias.getDate() + 30);

    // Stock por producto (suma de todos los lotes)
    const stockMap = {};
    lotes.forEach(l => {
        const nombre = l.Producto?.nombre || `Producto ${l.idProducto}`;
        if (!stockMap[nombre]) stockMap[nombre] = { stock: 0, esInterno: l.Producto?.esUsoInterno };
        stockMap[nombre].stock += l.cantidadDisponible;
    });

    // Alertas de vencimiento próximo (≤30 días) y vencidos
    const proximos  = [];
    const vencidos  = [];
    const sinStock  = [];

    lotes.forEach(l => {
        if (l.cantidadDisponible === 0) {
            sinStock.push({
                producto:   l.Producto?.nombre || "—",
                lote:       l.codigoLote,
                vencimiento: l.fechaVencimiento
            });
            return;
        }
        const fv = new Date(l.fechaVencimiento);
        if (fv < hoy) {
            vencidos.push({
                producto:    l.Producto?.nombre || "—",
                lote:        l.codigoLote,
                vencimiento: l.fechaVencimiento,
                stock:       l.cantidadDisponible
            });
        } else if (fv <= en30dias) {
            proximos.push({
                producto:    l.Producto?.nombre || "—",
                lote:        l.codigoLote,
                vencimiento: l.fechaVencimiento,
                stock:       l.cantidadDisponible
            });
        }
    });

    // Top 10 productos con más stock
    const topStock = Object.entries(stockMap)
        .sort((a, b) => b[1].stock - a[1].stock)
        .slice(0, 10)
        .map(([nombre, datos]) => ({ nombre, stock: datos.stock, esInterno: datos.esInterno }));

    return {
        kpis: {
            totalLotes:       lotes.length,
            lotesVencidos:    vencidos.length,
            lotesPorVencer:   proximos.length,
            productosSinStock: sinStock.length
        },
        topStock,
        vencidos:   vencidos.slice(0, 20),
        proximos:   proximos.slice(0, 20),
        sinStock:   sinStock.slice(0, 20)
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONTROLADOR PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
async function getReports(req, res, next) {
    try {
        const { tab = "turnos", desde, hasta } = req.query;

        let data;
        if (tab === "turnos")     data = await reporteTurnos(desde, hasta);
        else if (tab === "ventas") data = await reporteVentas(desde, hasta);
        else if (tab === "clinico") data = await reporteClinico(desde, hasta);
        else if (tab === "inventario") data = await reporteInventario();
        else return res.status(400).send({ msg: `Tab desconocido: ${tab}` });

        return res.status(200).send({ tab, desde, hasta, ...data });
    } catch (error) {
        next(error);
    }
}

module.exports = { getReports };