const Vaccine = require("../models/vaccine");
const Product = require("../models/product");

async function createVaccine(req, res, next) {
    try {
        const vaccine = await Vaccine.create(req.body);
        return res.status(201).send(vaccine);
    } catch (error) {
        next(error);
    }
}

async function getVaccines(req, res, next) {
    try {
        const vaccines = await Vaccine.findAll({
            include: [{
                model: Product,
                as: 'Producto', // Sincronizado con el alias del modelo
                attributes: ['nombre']
            }]
        });
        return res.status(200).send(vaccines);
    } catch (error) {
        next(error);
    }
}

async function getVaccine(req, res, next) {
    try {
        const { id } = req.params;
        const vaccine = await Vaccine.findByPk(id);
        if (!vaccine) return res.status(404).send({ msg: "Vacuna no encontrada." });
        return res.status(200).send(vaccine);
    } catch (error) {
        next(error);
    }
}

async function updateVaccine(req, res, next) {
    try {
        const { id } = req.params;
        const { 
            volumenDosis, 
            enfermedadPreventiva, 
            idEspecie, 
            cantidadDosisEsquema, 
            intervaloReaplicacionMeses 
        } = req.body;

        const vaccine = await Vaccine.findByPk(id);
        if (!vaccine) return res.status(404).send({ msg: "La vacuna no existe." });

        // Normalización para comparar strings
        const cleanVolumenDosis = volumenDosis ? volumenDosis.trim() : vaccine.volumenDosis;
        const cleanEnf = enfermedadPreventiva 
            ? enfermedadPreventiva.trim().charAt(0).toUpperCase() + enfermedadPreventiva.trim().slice(1).toLowerCase() 
            : vaccine.enfermedadPreventiva;

        // Normalización para comparar enteros
        const cleanCantidad = cantidadDosisEsquema !== undefined ? Number(cantidadDosisEsquema) : vaccine.cantidadDosisEsquema;
        const cleanIntervalo = intervaloReaplicacionMeses !== undefined ? Number(intervaloReaplicacionMeses) : vaccine.intervaloReaplicacionMeses;

        // Validación de "No cambios" (Incluye las nuevas propiedades)
        if (
            vaccine.volumenDosis === cleanVolumenDosis && 
            vaccine.enfermedadPreventiva === cleanEnf && 
            vaccine.idEspecie === idEspecie &&
            vaccine.cantidadDosisEsquema === cleanCantidad &&
            vaccine.intervaloReaplicacionMeses === cleanIntervalo
        ) {
            return res.status(400).send({ 
                msg: "No se realizaron cambios: la información es idéntica a la actual." 
            });
        }

        // Actualización de todos los atributos en la base de datos
        await vaccine.update({ 
            volumenDosis: cleanVolumenDosis, 
            enfermedadPreventiva: cleanEnf, 
            idEspecie: idEspecie,
            cantidadDosisEsquema: cleanCantidad,
            intervaloReaplicacionMeses: cleanIntervalo
        });

        return res.status(200).send({ msg: "Vacuna actualizada correctamente.", vaccine });

    } catch (error) {
        next(error);
    }
}

async function deleteVaccine(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await Vaccine.destroy({ where: { idProducto: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrada." });
        return res.status(200).send({ msg: "Registro de vacuna eliminado." });
    } catch (error) {
        next(error);
    }
}

async function getVaccineByProduct(req, res, next) {
    try {
        const { idProducto } = req.params;
        const vaccine = await Vaccine.findOne({ where: { idProducto: idProducto } });
        if (!vaccine) return res.status(404).send({ msg: "Vacuna no encontrada para este producto." });
        return res.status(200).send(vaccine);
    } catch (error) { next(error); }
}

module.exports = {
    createVaccine,
    getVaccines,
    getVaccine,
    updateVaccine,
    deleteVaccine,
    getVaccineByProduct
};