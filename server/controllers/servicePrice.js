const ServicePrice = require("../models/servicePrice");
const Service = require("../models/service");
const AnimalSize = require("../models/animalSize");
const ServiceType = require("../models/serviceType")

async function createServicePrice(req, res, next) {
    try {
        const price = await ServicePrice.create(req.body);
        return res.status(201).send(price);
    } catch (error) {
        next(error);
    }
}

async function getServicePrices(req, res, next) {
    try {
        const prices = await ServicePrice.findAll({
            include: [
                { 
                    model: Service, 
                    as: 'Service', 
                    attributes: ['idServicio', 'descripcion', 'idTipoServicio'],
                    // Relación anidada: Service -> TipoServicio
                    include: [{ 
                        model: ServiceType, 
                        as: 'ServiceType', 
                        attributes: ['descripcion'] 
                    }]
                },
                { 
                    model: AnimalSize, 
                    as: 'AnimalSize', // Cambiado para que sea único
                    attributes: ['descripcion'] 
                }
            ]
        });
        return res.status(200).send(prices);
    } catch (error) {
        next(error);
    }
}

async function getServicePrice(req, res, next) {
    try {
        const price = await ServicePrice.findByPk(req.params.id, {
            include: [
                { model: Service, attributes: ['descripcion'] },
                { model: AnimalSize, attributes: ['descripcion'] }
            ]
        });
        if (!price) return res.status(404).send({ msg: "Precio de servicio no encontrado." });
        return res.status(200).send(price);
    } catch (error) {
        next(error);
    }
}

async function updateServicePrice(req, res, next) {
    try {
        const price = await ServicePrice.findByPk(req.params.id);
        if (!price) return res.status(404).send({ msg: "No encontrado." });
        
        await price.update(req.body);
        return res.status(200).send({ msg: "Actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteServicePrice(req, res, next) {
    try {
        const deleted = await ServicePrice.destroy({ where: { idPrecioServicio: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Eliminado con éxito." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createServicePrice, 
    getServicePrices, 
    getServicePrice, 
    updateServicePrice, 
    deleteServicePrice 
};