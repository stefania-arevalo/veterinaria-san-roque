const Species = require("../models/species");
const { Op } = require("sequelize");

async function createSpecies(req, res, next) {
    const { nombre } = req.body;

    try {
        const existing = await Species.findOne({ where: { nombre: nombre } });
        if (existing) {
            return res.status(400).send({ msg: "Esta especie ya existe." });
        }

        const species = await Species.create(req.body);
        return res.status(201).send(species);
    } catch (error) {
        next(error);
    }
}

async function getSpecies(req, res, next) {
    try {
        const speciesList = await Species.findAll();
        return res.status(200).send(speciesList);
    } catch (error) {
        next(error);
    }
}

async function getOneSpecies(req, res, next) {
    const { id } = req.params;
    try {
        const species = await Species.findByPk(id);
        if (!species) return res.status(404).send({ msg: "Especie no encontrada." });
        return res.status(200).send(species);
    } catch (error) {
        next(error);
    }
}

async function updateSpecies(req, res, next) {
    const { id } = req.params;
    const { nombre } = req.body;

    try {
        const species = await Species.findByPk(id);
        if (!species) return res.status(404).send({ msg: "Especie no encontrada." });

        // Validación proactiva de duplicados
        if (nombre) {
            const duplicate = await Species.findOne({
                where: { 
                    nombre: nombre,
                    idEspecie: { [Op.ne]: id } 
                }
            });
            if (duplicate) return res.status(400).send({ msg: "Ya existe una especie con ese nombre." });
        }

        await species.update(req.body);
        return res.status(200).send({ msg: "Especie actualizada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteSpecies(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Species.destroy({ where: { idEspecie: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Especie no encontrada." });
        return res.status(200).send({ msg: "Especie eliminada." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createSpecies, 
    getSpecies, 
    getOneSpecies, 
    updateSpecies, 
    deleteSpecies 
};