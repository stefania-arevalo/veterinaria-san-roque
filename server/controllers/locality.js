const Locality = require("../models/locality");
const { Op } = require("sequelize");

async function createLocality(req, res, next) {
    try {
        const locality = await Locality.create(req.body);
        return res.status(201).send(locality);
    } catch (error) {
        next(error);
    }
}

async function getLocalities(req, res, next) {
    const { idLocalidad, nombre } = req.query; // Búsqueda flexible
    let whereClause = {};

    if (idLocalidad) whereClause.idLocalidad = idLocalidad;
    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };

    try {
        const localities = await Locality.findAll({ 
            where: whereClause,
            order: [['nombre', 'ASC']] 
        });
        return res.status(200).send(localities);
    } catch (error) {
        next(error);
    }
}

async function updateLocality(req, res, next) {
    try {
        const locality = await Locality.findByPk(req.params.id);
        if (!locality) return res.status(404).send({ msg: "Localidad no encontrada." });

        await locality.update(req.body);
        return res.status(200).send({ msg: "Localidad actualizada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteLocality(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Locality.destroy({ where: { idLocalidad: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Localidad no encontrada." });
        return res.status(200).send({ msg: "Localidad eliminada correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createLocality, 
    getLocalities, 
    updateLocality, 
    deleteLocality 
};