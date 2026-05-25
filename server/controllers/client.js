const Client = require("../models/client");
const Staff = require("../models/staff");
const Locality = require("../models/locality");
const User = require("../models/user");
const { Op } = require("sequelize");

async function createClient(req, res, next) {
    const { dni, idUsuario } = req.body;
    try {
        const isStaffDni = await Staff.findOne({ where: { dni } });
        if (isStaffDni) return res.status(400).send({ msg: "Este DNI pertenece al personal de la clínica." });

        if (idUsuario) {
            const isStaffUser = await Staff.findOne({ where: { idUsuario } });
            if (isStaffUser) return res.status(400).send({ msg: "Este usuario ya está vinculado a un perfil de Staff." });

            const alreadyClient = await Client.findOne({ where: { idUsuario } });
            if (alreadyClient) return res.status(400).send({ msg: "Este usuario ya está asignado a otro cliente." });
        }

        const client = await Client.create(req.body);
        return res.status(201).send(client);
    } catch (error) {
        next(error);
    }
}

async function getClients(req, res, next) {
    const { search } = req.query;
    let whereClause = {};

    if (search) {
        whereClause = {
            [Op.or]: [
                { nombres: { [Op.like]: `%${search}%` } },
                { apellidos: { [Op.like]: `%${search}%` } },
                { dni: { [Op.like]: `%${search}%` } },
                { correo: { [Op.like]: `%${search}%` } }
            ]
        };
    }

    try {
        const clients = await Client.findAll({ 
            where: whereClause,
            include: [
                { model: Locality }, 
                { model: User, attributes: ["idUsuario", "usuario", "estado", 'idRol'] }
            ] 
        });
        return res.status(200).send(clients);
    } catch (error) {
        next(error);
    }
}

async function getClient(req, res, next) {
    const { id } = req.params;
    try {
        const client = await Client.findByPk(id, { include: [Locality, User] });
        if (!client) return res.status(404).send({ msg: "Cliente no encontrado." });

        if (req.user.idRol === 5 && client.idUsuario !== req.user.user_id) {
            return res.status(403).send({ msg: "No tienes permiso para ver otros perfiles." });
        }
        return res.status(200).send(client);
    } catch (error) {
        next(error);
    }
}

async function updateClient(req, res, next) {
    const { id } = req.params;
    const { idUsuario } = req.body;
    try {
        const client = await Client.findByPk(id);
        if (!client) return res.status(404).send({ msg: "Cliente no encontrado." });

        if (req.user.idRol === 5 && client.idUsuario !== req.user.user_id) {
            return res.status(403).send({ msg: "No puedes editar datos ajenos." });
        }

        if (idUsuario && idUsuario !== client.idUsuario) {
            const userInUse = await Client.findOne({ 
                where: { idUsuario, idCliente: { [Op.ne]: id } } 
            });
            if (userInUse) return res.status(400).send({ msg: "Este usuario ya está asignado a otro cliente." });

            const isStaff = await Staff.findOne({ where: { idUsuario } });
            if (isStaff) return res.status(400).send({ msg: "Este usuario pertenece al personal." });
        }

        await client.update(req.body);
        return res.status(200).send({ msg: "Cliente actualizado correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteClient(req, res, next) {
    const { id } = req.params;
    try {
        // 1. Buscamos el cliente para guardar su idUsuario antes de borrarlo
        const client = await Client.findByPk(id);
        if (!client) return res.status(404).send({ msg: "No existe el cliente." });

        const idUsuarioLinked = client.idUsuario;

        // 2. Intentamos borrar el cliente
        // Si hay una mascota asociada, Sequelize lanzará un SequelizeForeignKeyConstraintError
        await Client.destroy({ where: { idCliente: id } });

        // 3. Si se borró el cliente con éxito y tenía un usuario asociado, borramos el usuario
        if (idUsuarioLinked) {
            await User.destroy({ where: { idUsuario: idUsuarioLinked } });
        }

        return res.status(200).send({ msg: "Cliente y su acceso al sistema eliminados correctamente." });
    } catch (error) {
        // Capturamos el error si la base de datos rechaza el borrado por tener tablas asociadas (mascotas, turnos)
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).send({ 
                msg: "No puedes eliminar este cliente porque tiene mascotas o historial clínico asociado en el sistema." 
            });
        }
        next(error);
    }
}

module.exports = { 
    createClient, 
    getClients, 
    getClient, 
    updateClient, 
    deleteClient 
};