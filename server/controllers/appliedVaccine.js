const AppliedVaccine = require("../models/appliedVaccine");
const Batch = require("../models/batch");
const Product = require("../models/product");
const Vaccine = require("../models/vaccine"); 
const { Op } = require("sequelize");
const sequelize = require("../db");

async function createAppliedVaccine(req, res, next) {
    try {
        const { idHistorial, idVacuna, dosis, fechaAplicacion } = req.body;

        // ── LÓGICA FIFO: buscar el lote con vencimiento más próximo ──
        const lote = await Batch.findOne({
            where: {
                idProducto:       idVacuna,
                cantidadDisponible: { [Op.gt]: 0 },  
                fechaVencimiento: { [Op.gt]: new Date() }
            },
            order: [["fechaVencimiento", "ASC"]]
        });
        
    

        if (!lote) {
            return res.status(400).send({ 
                msg: "No hay stock disponible para esta vacuna. Verificá los lotes." 
            });
        }

        const prodPres = await ProductPresentation.findOne({
            where: { idProducto: idVacuna }
        });
        const precioAplicado = prodPres ? parseFloat(prodPres.precio) : 0;

        const entry = await AppliedVaccine.create({
            idHistorial,
            idVacuna,
            idLote: lote.idLote,
            dosis,
            fechaAplicacion,
            precioAplicado, 
            cobrada: 0
        });

        // Descontar una unidad del lote
        await lote.update({ cantidadDisponible: lote.cantidadDisponible - 1 });

        return res.status(201).send(entry);

    } catch (error) {
        next(error);
    }
}


async function getAllApplied(req, res, next) {
    try {
        const list = await AppliedVaccine.findAll({
            include: [{
                model: Vaccine,
                as: 'Vacuna',
                include: [{ model: Product, as: 'Producto', attributes: ['nombre'] }]
            }]
        });
        return res.status(200).send(list);
    } catch (error) {
        next(error);
    }
}

async function getAppliedById(req, res, next) {
    try {
        const { id } = req.params;
        const entry = await AppliedVaccine.findByPk(id);
        if (!entry) return res.status(404).send({ msg: "Registro no encontrado." });
        return res.status(200).send(entry);
    } catch (error) {
        next(error);
    }
}

async function updateApplied(req, res, next) {
    try {
        const { id } = req.params;
        const entry = await AppliedVaccine.findByPk(id);
        if (!entry) return res.status(404).send({ msg: "El registro no existe." });

        let hasChanges = false;
        const fields = ['idHistorial', 'idVacuna', 'idLote', 'dosis', 'fechaAplicacion'];

        fields.forEach(field => {
            if (req.body[field] !== undefined && String(entry[field]) !== String(req.body[field])) {
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            return res.status(400).send({ msg: "No se detectaron cambios para actualizar." });
        }

        await entry.update(req.body);
        return res.status(200).send({ msg: "Registro actualizado correctamente.", entry });
    } catch (error) {
        next(error);
    }
}

async function deleteApplied(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await AppliedVaccine.destroy({ where: { idVacunaAplicada: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el registro." });
        return res.status(200).send({ msg: "Registro eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function getUncollectedByPet(req, res, next) {
    try {
        const { idMascota } = req.params;
        const ClinicalHistory = require("../models/clinicalHistory");

        const historiales = await ClinicalHistory.findAll({ where: { idMascota } });
        if (!historiales.length) return res.status(200).send([]);

        const historialIds = historiales.map(h => h.idHistorial);

        const vacunas = await AppliedVaccine.findAll({
            where: { idHistorial: { [Op.in]: historialIds }, cobrada: 0 },
            include: [{
              model: Vaccine,
              as: 'Vacuna',
              include: [{ model: Product, as: 'Producto', attributes: ['nombre'] }]
            }, {
              model: ClinicalHistory,  // ← agregar esto
              as: 'Historial',
              attributes: ['idCita']   // ← solo necesitamos el idCita
            }]
        });

        return res.status(200).send(vacunas);
    } catch (error) {
        console.error("Error en getUncollectedByPet:", error.message);
        next(error);
    }
}

module.exports = {
    createAppliedVaccine,
    getAllApplied,
    getAppliedById,
    updateApplied,
    deleteApplied,
    getUncollectedByPet
};