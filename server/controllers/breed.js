const Breed = require("../models/breed");
const Species = require("../models/species");
const { Op } = require("sequelize");

async function createBreed(req, res, next) {
    const { nombre, idEspecie } = req.body;
    try {
        // Validar si la combinacion nombre + especie ya existe
        const existing = await Breed.findOne({ where: { nombre, idEspecie } });
        if (existing) return res.status(400).send({ msg: "Esta raza ya está registrada para esa especie." });

        const breed = await Breed.create(req.body);
        return res.status(201).send(breed);
    } catch (error) {
        next(error);
    }
}

async function getBreeds(req, res, next) {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
        whereClause = {
            [Op.or]: [
                { nombre: { [Op.like]: `%${search}%` } },
                { '$Species.nombre$': { [Op.like]: `%${search}%` } } 
            ]
        };
    }

    try {
        const breeds = await Breed.findAll({ 
            where: whereClause,
            include: [{ model: Species, as: 'Especie', attributes: ['nombre'] }] 
        });
        return res.status(200).send(breeds);
    } catch (error) {
        next(error);
    }
}

async function getBreed(req, res) {
    const { id } = req.params;
    try {
        const breed = await Breed.findByPk(id, { include: Species });
        if (!breed) return res.status(404).send({ msg: "Raza no encontrada." });
        return res.status(200).send(breed);
    } catch (error) {
        next(error);
    }
}

async function updateBreed(req, res, next) {
    const { id } = req.params;
    const { nombre, idEspecie } = req.body;

    try {
        const breed = await Breed.findByPk(id);
        if (!breed) return res.status(404).send({ msg: "Raza no encontrada." });

        // Proactive Duplicate Check
        if (nombre || idEspecie) {
            const duplicate = await Breed.findOne({
                where: { 
                    nombre: nombre || breed.nombre,
                    idEspecie: idEspecie || breed.idEspecie,
                    idRaza: { [Op.ne]: id }
                }
            });
            if (duplicate) return res.status(400).send({ msg: "Ya existe una raza con ese nombre para esa especie." });
        }

        await breed.update(req.body);
        return res.status(200).send({ msg: "Raza actualizada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteBreed(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Breed.destroy({ where: { idRaza: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Raza no encontrada." });
        return res.status(200).send({ msg: "Raza eliminada." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createBreed, 
    getBreeds, 
    getBreed, 
    updateBreed, 
    deleteBreed 
};