const Role = require("../models/role");
const { Op } = require("sequelize");

async function createRole(req, res, next) {
    const { nombre } = req.body;
    try {
        const existing = await Role.findOne({ where: { nombre } });
        if (existing) return res.status(400).send({ msg: "Este rol ya existe." });

        const roleStorage = await Role.create(req.body);
        return res.status(201).send(roleStorage);
    } catch (error) {
        next(error);
    }
}

async function getRoles(req, res, next) {
    try {
        const roles = await Role.findAll();
        return res.status(200).send(roles);
    } catch (error) {
        next(error);
    }
}

async function updateRole(req, res, next) {
    const { id } = req.params;

    try {
        const roleToUpdate = await Role.findByPk(id);
        if (!roleToUpdate) {
            return res.status(404).send({ msg: "No se encontró el rol a actualizar." });
        }

        // Usamos instance.update() para que se disparen los hooks (beforeValidate)
        await roleToUpdate.update(req.body);

        return res.status(200).send({ msg: "Rol actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteRole(req, res, next) {
    const { id } = req.params;

    try {
        const deletedRows = await Role.destroy({ where: { idRol: id } });
        
        if (deletedRows === 0) {
            return res.status(404).send({ msg: "Rol no encontrado." });
        }
        
        return res.status(200).send({ msg: "Rol eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createRole,
    getRoles,
    updateRole,
    deleteRole
};