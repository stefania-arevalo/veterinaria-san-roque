const Assistant = require("../models/assistant");
const Staff = require("../models/staff");
const User = require("../models/user");
const { Op } = require("sequelize");

// C: Solo Admin
async function createAssistant(req, res, next) {
    try {
        const staff = await Staff.findByPk(req.body.idPersonal, { include: User });
        if (!staff || staff.User.idRol !== 3) return res.status(403).send({ msg: "El personal debe ser Rol 3." });
        
        const assistant = await Assistant.create(req.body);
        return res.status(201).send(assistant);
    } catch (error) {
        next(error);
    }
}

// R: GET ALL (Búsqueda por nombres, dni, idUsuario o certificados)
async function getAssistants(req, res, next) {
    const { search } = req.query;
    let whereStaff = {};
    let whereAsis = {};

    if (search) {
        whereStaff = {
            [Op.or]: [
                { nombres: { [Op.like]: `%${search}%` } },
                { apellidos: { [Op.like]: `%${search}%` } },
                { dni: { [Op.like]: `%${search}%` } },
                { idUsuario: { [Op.like]: `%${search}%` } }
            ]
        };
        whereAsis = {
            [Op.or]: [{ certificados: { [Op.like]: `%${search}%` } }]
        };
    }

    try {
        const assistants = await Assistant.findAll({ 
            where: search ? { [Op.or]: [whereAsis, { '$Staff.nombres$': { [Op.like]: `%${search}%` } }] } : {},
            include: [{ model: Staff, where: whereStaff, required: false }] 
        });
        return res.status(200).send(assistants);
    } catch (error) {
        next(error);
    }
}

// R: GET ONE (Cualquier staff con permiso R puede verlo)
async function getAssistant(req, res, next) {
    const { id } = req.params;
    try {
        const asis = await Assistant.findByPk(id, { include: Staff });
        if (!asis) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send(asis);
    } catch (error) {
        next(error);
    }
}

// U: UPDATE (Lógica OWN)
async function updateAssistant(req, res, next) {
    const { id } = req.params;
    try {
        const asis = await Assistant.findByPk(id, { include: Staff });
        if (!asis) return res.status(404).send({ msg: "No encontrado." });

        // Solo Admin o el propio Asistente edita
        if (req.user.idRol !== 1 && asis.Staff.idUsuario !== req.user.user_id) {
            return res.status(403).send({ msg: "Solo puedes editar tu propio perfil." });
        }

        await asis.update(req.body);
        return res.status(200).send({ msg: "Perfil actualizado." });
    } catch (error) {
        next(error);
    }
}

// D: Solo Admin
async function deleteAssistant(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Assistant.destroy({ where: { idPersonal: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Asistente eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createAssistant, 
    getAssistants, 
    getAssistant, 
    updateAssistant, 
    deleteAssistant 
};