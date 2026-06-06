const Staff = require("../models/staff");
const Client = require("../models/client");
const Locality = require("../models/locality");
const User = require("../models/user");
const Salary = require("../models/salary");
const Role = require ("../models/role");
const Veterinarian = require("../models/veterinarian");
const ProfessionalCard = require("../models/professionalCard")
const Assistant = require("../models/assistant");
const Seller = require("../models/seller");
const Admin = require("../models/admin");
const { Op } = require("sequelize");

async function createStaff(req, res, next) {
    try {
        const { idUsuario } = req.body;

        if (idUsuario) {
            const alreadyStaff = await Staff.findOne({ where: { idUsuario } });
            if (alreadyStaff) return res.status(400).send({ msg: "Este usuario ya está asignado a otro personal." });
            const isClient = await Client.findOne({ where: { idUsuario } });
            if (isClient) return res.status(400).send({ msg: "Este usuario ya es Cliente y no puede ser Personal." });
        }

        // 3. Si pasó las validaciones, creamos
        const staff = await Staff.create(req.body);
        
        // Retornamos el staff con sus relaciones para confirmar éxito
        const newStaff = await Staff.findByPk(staff.idPersonal, {
            include: [{ model: User, attributes: ["usuario"] }, { model: Locality }]
        });

        return res.status(201).send(newStaff);

    } catch (error) {
        next(error);
    }
}

async function getStaffs(req, res, next) {
    const { search, idRol } = req.query;
    let whereClause = {};
 
    if (search) {
        whereClause = {
            [Op.or]: [
                { nombres:   { [Op.like]: `%${search}%` } },
                { apellidos: { [Op.like]: `%${search}%` } },
                { dni:       { [Op.like]: `%${search}%` } },
                { correo:    { [Op.like]: `%${search}%` } }
            ]
        };
    }
 
    try {
        const staffs = await Staff.findAll({
            where: whereClause,
            include: [
                { model: Locality },
                { model: User, include: { model: Role }, attributes: { exclude: ["contraseña"] } },
                { model: Salary },
                { model: Veterinarian, include: [{ model: ProfessionalCard }] },
                { model: Assistant },
                { model: Admin },
                { model: Seller }
            ]
        });
 
        // Filtro por rol usando tablas hijas (más confiable que User.idRol,
        // porque el staff puede existir sin usuario vinculado)
        let result = staffs;
        if (idRol) {
            const rol = parseInt(idRol);
            result = staffs.filter(s => {
                if (rol === 1) return !!s.Admin;
                if (rol === 2) return !!s.Veterinarian;
                if (rol === 3) return !!s.Assistant;
                if (rol === 4) return !!s.Seller;
                return false;
            });
        }
 
        return res.status(200).send(result);
    } catch (error) {
        next(error);
    }
}

async function getStaff(req, res, next) {
    const { id } = req.params;
    try {
        const staff = await Staff.findByPk(id, {
            include: [
                { model: Locality },
                { model: User, attributes: { exclude: ["contraseña"] } },
                { model: Salary }
            ]
        });
        if (!staff) return res.status(404).send({ msg: "Personal no encontrado." });
        return res.status(200).send(staff);
    } catch (error) {
        next(error);
    }
}

async function updateStaff(req, res, next) {
    const { id } = req.params;
    const { idUsuario } = req.body;

    try {
        const staff = await Staff.findByPk(id);
        if (!staff) return res.status(404).send({ msg: "Personal no encontrado." });

        // 1. REGLA DE SEGURIDAD (Solo Admin o el dueño del perfil)
        if (req.user.idRol !== 1 && staff.idUsuario !== req.user.user_id) {
            return res.status(403).send({ msg: "No tienes permiso para modificar este perfil." });
        }

        // 2. VALIDACIÓN DE DUPLICADO DE USUARIO
        if (idUsuario && idUsuario !== staff.idUsuario) {
            // Buscamos si ese nuevo idUsuario ya lo tiene OTRO staff
            const userInUse = await Staff.findOne({ 
                where: { 
                    idUsuario,
                    idPersonal: { [Op.ne]: id } // Que no sea el mismo que estoy editando
                } 
            });

            if (userInUse) {
                return res.status(400).send({ msg: "Ese ID de usuario ya está asignado a otro empleado." });
            }

            // También chequeamos que no sea un Cliente
            const isClient = await Client.findOne({ where: { idUsuario } });
            if (isClient) {
                return res.status(400).send({ msg: "Ese usuario ya es Cliente y no puede ser Personal." });
            }
        }

        const [updatedRows] = await Staff.update(req.body, { where: { idPersonal: id } });
        return res.status(200).send({ msg: "Datos de personal actualizados." });
        
    } catch (error) {
        next(error);
    }
}

async function deleteStaff(req, res, next) {
    const { id } = req.params;
    try {
        // Si es veterinario, guardamos el idMatricula antes de que se borre en cascade
        const vet = await Veterinarian.findOne({ where: { idPersonal: id } });

        const deleted = await Staff.destroy({ where: { idPersonal: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Registro no encontrado." });

        // Eliminar la matrícula huérfana (el registro Veterinarian ya fue borrado por cascade)
        if (vet) {
            await ProfessionalCard.destroy({ where: { idMatricula: vet.idMatricula } });
        }

        return res.status(200).send({ msg: "Registro de personal eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createStaff, 
    getStaffs, 
    getStaff, 
    updateStaff, 
    deleteStaff 
};