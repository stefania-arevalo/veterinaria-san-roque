const Provider = require("../models/provider");

async function createProvider(req, res, next) {
    try {
        const provider = await Provider.create(req.body);
        return res.status(201).send(provider);
    } catch (error) {
        next(error);
    }
}

async function getProviders(req, res, next) {
    try {
        const providers = await Provider.findAll();
        return res.status(200).send(providers);
    } catch (error) {
        next(error);
    }
}

async function getProvider(req, res, next) {
    try {
        const provider = await Provider.findByPk(req.params.id);
        if (!provider) return res.status(404).send({ msg: "Proveedor no encontrado." });
        return res.status(200).send(provider);
    } catch (error) {
        next(error);
    }
}

async function updateProvider(req, res, next) {
    try {
        const provider = await Provider.findByPk(req.params.id);
        if (!provider) return res.status(404).send({ msg: "El proveedor no existe." });

        await provider.update(req.body);
        return res.status(200).send({ msg: "Proveedor actualizado.", provider });
    } catch (error) {
        next(error);
    }
}

async function deleteProvider(req, res, next) {
    try {
        const deleted = await Provider.destroy({ where: { idProveedor: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "Proveedor no encontrado." });
        return res.status(200).send({ msg: "Proveedor eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { createProvider, getProviders, getProvider, updateProvider, deleteProvider };