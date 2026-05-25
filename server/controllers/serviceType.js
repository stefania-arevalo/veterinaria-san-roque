const ServiceType = require("../models/serviceType");

async function createServiceType(req, res, next) {
    try {
        const type = await ServiceType.create(req.body);
        return res.status(201).send(type);
    } catch (error) {
        next(error);
    }
}

async function getServiceTypes(req, res, next) {
    try {
        const types = await ServiceType.findAll();
        return res.status(200).send(types);
    } catch (error) {
        next(error);
    }
}

async function getServiceType(req, res, next) {
    try {
        const type = await ServiceType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "Tipo de servicio no encontrado." });
        return res.status(200).send(type);
    } catch (error) {
        next(error);
    }
}

async function updateServiceType(req, res, next) {
    try {
        const type = await ServiceType.findByPk(req.params.id);
        if (!type) return res.status(404).send({ msg: "No encontrado." });
        
        await type.update(req.body);
        return res.status(200).send({ msg: "Actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteServiceType(req, res, next) {
    try {
        const deleted = await ServiceType.destroy({ where: { idTipoServicio: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Eliminado con éxito." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createServiceType, 
    getServiceTypes, 
    getServiceType, 
    updateServiceType, 
    deleteServiceType 
};