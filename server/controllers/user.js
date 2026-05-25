const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Role = require("../models/role");
const Staff = require("../models/staff"); 
const Client = require("../models/client");
const { Op } = require("sequelize");

async function getMe(req, res, next) {
    const { user_id } = req.user; // Viene del token JWT

    try {
        const user = await User.findByPk(user_id, {
            attributes: { exclude: ["contraseña"] },
            include: [{ model: Role }] 
        });

        if (!user) return res.status(404).send({ msg: "No se ha encontrado el usuario" });

        res.status(200).send(user);
    } catch (error) {
        next(error);
    }
}

async function getUsers(req, res, next) {
    const { search, idRol, estado } = req.query;
    let whereClause = {};

    // Filtro por nombre de usuario
    if (search) {
        whereClause.usuario = { [Op.like]: `%${search}%` };
    }

    // Filtro por Rol
    if (idRol) {
        whereClause.idRol = idRol;
    }

    // Filtro por Estado
    if (estado !== undefined && estado !== "") {
        whereClause.estado = estado === 'true';
    }

    try {
        const users = await User.findAll({
            where: whereClause,
            attributes: ["idUsuario", "usuario", "estado", "idRol"],
            include: [
                { 
                    // CORRECCIÓN: Usamos directamente 'Staff', no 'models.Staff'
                    model: Staff, 
                    attributes: ["nombres", "apellidos", "dni"], 
                    required: false 
                },
                { 
                    // CORRECCIÓN: Usamos directamente 'Client', no 'models.Client'
                    model: Client, 
                    attributes: ["nombres", "apellidos", "dni"], 
                    required: false 
                }
            ],
            order: [["usuario", "ASC"]]
        });
        return res.status(200).send(users);
    } catch (error) {
        console.error("Error en getUsers:", error); // Esto te ayudará a ver errores más claros en la consola
        next(error);
    }
}

async function createUser(req, res, next) {
    const { usuario, contraseña, idRol, estado } = req.body;

    try {
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(contraseña, salt);

        const user = await User.create({
            usuario: usuario, 
            contraseña: hashPassword,
            idRol: idRol,
            estado: estado !== undefined ? estado : true 
        });

        const userResponse = user.toJSON();
        delete userResponse.contraseña;

        res.status(201).send(userResponse);
    } catch (error) {
        next(error);
    }
}

async function updateUser(req, res, next) {
    const { id } = req.params;
    const userData = req.body;

    try {
        const userToUpdate = await User.findByPk(id);
        if (!userToUpdate) return res.status(404).send({ msg: "Usuario no encontrado" });

        if (req.user.idRol !== 1) { 
            if (userToUpdate.idUsuario !== req.user.user_id) { 
                return res.status(403).send({ msg: "No tienes permiso para modificar este perfil ajeno." }); 
            }
            // Si es su perfil, le quitamos permisos para que no pueda cambiarse el rol ni su estado (auto-darse permisos de Admin)
            delete userData.idRol; 
            delete userData.estado; 
        }

        // Manejo seguro de contraseña si deciden actualizarla
        const rawPassword = userData.contraseña || userData.password;
        if (rawPassword) {
            if (rawPassword.length < 6) {
                return res.status(400).send({ msg: "La nueva contraseña debe tener al menos 6 caracteres." });
            }
            const salt = bcrypt.genSaltSync(10);
            userData.contraseña = bcrypt.hashSync(rawPassword, salt);
            delete userData.password;
        }
        
        await userToUpdate.update(userData);

        res.status(200).send({ msg: "Usuario actualizado correctamente" });

    } catch (error) {
        next(error);
    }
}

async function deleteUser(req, res, next) {
    const { id } = req.params;

    try {
        const deleted = await User.destroy({ where: { idUsuario: id } });

        if (deleted === 0) {
            return res.status(404).send({ msg: "No se encontró el usuario" });
        }

        res.status(200).send({ msg: "Usuario eliminado correctamente" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMe,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
};