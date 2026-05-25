const Service = require("../models/service");
const ServiceType = require("../models/serviceType");

async function createService(req, res, next) {
    try {
        const service = await Service.create(req.body);
        return res.status(201).send(service);
    } catch (error) {
        next(error);
    }
}

async function getServices(req, res, next) {
    try {
        const services = await Service.findAll({
            include: [{ model: ServiceType, as: 'ServiceType', attributes: ['descripcion'] }]
        });
        return res.status(200).send(services);
    } catch (error) {
        next(error);
    }
}

async function getService(req, res, next) {
    try {
        const service = await Service.findByPk(req.params.id, {
            include: [{ model: ServiceType, attributes: ['descripcion'] }]
        });
        if (!service) return res.status(404).send({ msg: "Servicio no encontrado." });
        return res.status(200).send(service);
    } catch (error) {
        next(error);
    }
}

async function updateService(req, res, next) {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).send({ msg: "No encontrado." });
        
        await service.update(req.body);
        return res.status(200).send({ msg: "Servicio actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteService(req, res, next) {
    try {
        const deleted = await Service.destroy({ where: { idServicio: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Servicio eliminado con éxito." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createService, 
    getServices, 
    getService, 
    updateService, 
    deleteService 
};