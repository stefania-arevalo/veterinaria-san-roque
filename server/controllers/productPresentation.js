const ProductPresentation = require("../models/productPresentation");
const Presentation = require("../models/presentation");
const Product = require("../models/product");
const Medication = require("../models/medication");
const Batch = require("../models/batch");

async function createProdPres(req, res, next) {
    try {
        const entry = await ProductPresentation.create(req.body);
        return res.status(201).send(entry);
    } catch (error) {
        next(error);
    }
}

async function getAllProdPres(req, res, next) {
    try {
        const list = await ProductPresentation.findAll({
            where: { activo: true },
            include: [
                {
                    model: Product,
                    attributes: ["idProducto", "nombre"],
                    include: [
                        { model: Medication, as: "Medicamento", required: false },
                        {
                            model: Batch,
                            as: "Lotes",
                            attributes: ["idLote", "codigoLote", "cantidadDisponible", "fechaVencimiento"],
                            required: false,
                        },
                    ],
                },
                {
                    model: Presentation,
                    as: "Presentacion",
                    attributes: ["idPresentacion", "tipo", "formato"],
                },
            ],
            order: [["idProdPres", "ASC"]],
        });
        return res.status(200).send(list);
    } catch (error) {
        console.error("❌ Error en getAllProdPres:", error);
        next(error);
    }
}

async function getProdPres(req, res, next) {
    try {
        const { id } = req.params;
        const entry = await ProductPresentation.findOne({ where: { idProdPres: id, activo: true } });
        if (!entry) return res.status(404).send({ msg: "Registro no encontrado o desactivado." });
        return res.status(200).send(entry);
    } catch (error) {
        next(error);
    }
}

// ── CORREGIDO: acepta tanto "precio" como "activo" ─────────────────────────────
async function updateProdPres(req, res, next) {
    try {
        const { id } = req.params;
        const { precio, activo } = req.body;

        // Buscar sin filtrar por activo, para poder reactivar o desactivar
        const entry = await ProductPresentation.findByPk(id);
        if (!entry) return res.status(404).send({ msg: "Registro no encontrado." });

        // ── Desactivar (soft delete desde el frontend) ──
        if (activo === false) {
            await entry.update({ activo: false });
            return res.status(200).send({ msg: "Presentación desactivada correctamente." });
        }

        // ── Actualizar precio ──
        if (precio === undefined) {
            return res.status(400).send({ msg: "Debe enviar 'precio' o 'activo'." });
        }

        if (parseFloat(entry.precio) === parseFloat(precio)) {
            return res.status(400).send({ msg: "El precio es idéntico al actual, no se realizaron cambios." });
        }

        await entry.update({ precio });
        return res.status(200).send({ msg: "Precio actualizado correctamente.", entry });
    } catch (error) {
        next(error);
    }
}

async function deleteProdPres(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await ProductPresentation.update({ activo: false }, { where: { idProdPres: id } });
        if (updated[0] === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Relación desactivada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function getProdPresByProduct(req, res, next) {
    try {
        const { idProducto } = req.params;
        const rows = await ProductPresentation.findAll({
            where: { idProducto, activo: true },
            include: [{ model: Presentation, as: "Presentacion" }],
            attributes: ["idProdPres", "idProducto", "idPresentacion", "precio"],
        });

        const data = rows.map(r => ({
            idProdPres:     r.idProdPres,
            idProducto:     r.idProducto,
            idPresentacion: r.idPresentacion,
            precio:         parseFloat(r.precio || 0),
            Presentacion: r.Presentacion
                ? { tipo: r.Presentacion.tipo, formato: r.Presentacion.formato }
                : null,
        }));

        return res.status(200).json(data);
    } catch (error) {
        console.error("Error en getProdPresByProduct:", error);
        next(error);
    }
}

module.exports = {
    createProdPres,
    getAllProdPres,
    getProdPres,
    updateProdPres,
    deleteProdPres,
    getProdPresByProduct,
};