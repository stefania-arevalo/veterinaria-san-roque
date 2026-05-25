const AnimalSize = require("../models/animalSize");
const { Op } = require("sequelize");

async function createAnimalSize(req, res, next) {
    const { descripcion } = req.body;
    try {
        const existing = await AnimalSize.findOne({ where: { descripcion } });
        if (existing) return res.status(400).send({ msg: "Este tamaño ya existe." });

        const size = await AnimalSize.create(req.body);
        return res.status(201).send(size);
    } catch (error) {
        next(error);
    }
}

async function getAnimalSizes(req, res, next) {
    try {
        const sizes = await AnimalSize.findAll({ order: [['idTamaño', 'ASC']] });
        return res.status(200).send(sizes);
    } catch (error) {
        next(error);
    }
}

async function getAnimalSize(req, res, next) {
    const { id } = req.params;
    try {
        const size = await AnimalSize.findByPk(id);
        if (!size) return res.status(404).send({ msg: "Tamaño no encontrado." });
        return res.status(200).send(size);
    } catch (error) {
        next(error);
    }
}

async function updateAnimalSize(req, res, next) {
    const { id } = req.params;
    const { descripcion } = req.body;

    try {
        const size = await AnimalSize.findByPk(id);
        if (!size) return res.status(404).send({ msg: "Tamaño no encontrado." });

        if (descripcion) {
            const duplicate = await AnimalSize.findOne({
                where: { 
                    descripcion: descripcion,
                    idTamaño: { [Op.ne]: id } 
                }
            });

            if (duplicate) {
                return res.status(400).send({ msg: "Ya existe un tamaño con esa descripción." });
            }
        }

        await size.update(req.body);
        return res.status(200).send({ msg: "Tamaño actualizado correctamente." });

    } catch (error) {
        next(error); // Si ocurre otro error (ej: conexión), lo pasamos al manejador
    }
}

async function deleteAnimalSize(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await AnimalSize.destroy({ where: { idTamaño: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Tamaño no encontrado." });
        return res.status(200).send({ msg: "Tamaño eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createAnimalSize, 
    getAnimalSizes, 
    getAnimalSize, 
    updateAnimalSize, 
    deleteAnimalSize 
};