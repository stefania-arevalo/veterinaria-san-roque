const Veterinarian = require("../models/veterinarian");
const Staff = require("../models/staff");
const User = require("../models/user");
const ProfessionalCard = require("../models/professionalCard");

async function createVeterinarian(req, res, next) {
    const { idPersonal, especialidad, idMatricula } = req.body;
    try {
        const staffMember = await Staff.findByPk(idPersonal, { include: User });
        if (!staffMember || staffMember.User.idRol !== 2) {
            return res.status(403).send({ msg: "Solo el personal con Rol de Veterinario puede tener este perfil." });
        }
        const vet = await Veterinarian.create({ idPersonal, especialidad, idMatricula });
        return res.status(201).send(vet);
    } catch (error) {
        next(error);
    }
}

async function getVeterinarians(req, res, next) {
    try {
        const vets = await Veterinarian.findAll({ include: [Staff, ProfessionalCard] });
        return res.status(200).send(vets);
    } catch (error) {
        next(error);
    }
}

async function getVeterinarian(req, res, next) {
    const { id } = req.params;
    try {
        const vet = await Veterinarian.findByPk(id, { include: [Staff, ProfessionalCard] });
        if (!vet) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send(vet);
    } catch (error) {
        next(error);
    }
}

async function updateVeterinarian(req, res, next) {
    const { id } = req.params;
    try {
        const vet = await Veterinarian.findByPk(id, { include: Staff });
        if (!vet) return res.status(404).send({ msg: "No encontrado." });

        // U(own): Solo Admin (1) o el propio Veterinario (2) dueño del perfil
        if (req.user.idRol !== 1 && vet.Staff.idUsuario !== req.user.user_id) {
            return res.status(403).send({ msg: "No tienes permiso para editar este perfil profesional." });
        }

        await vet.update(req.body);
        return res.status(200).send({ msg: "Especialidad actualizada." });
    } catch (error) {
        next(error);
    }
}

async function deleteVeterinarian(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Veterinarian.destroy({ where: { idPersonal: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No existe registro." });
        return res.status(200).send({ msg: "Registro eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createVeterinarian, 
    getVeterinarians, 
    getVeterinarian, 
    updateVeterinarian, 
    deleteVeterinarian 
};