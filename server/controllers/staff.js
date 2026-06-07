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
const Sale              = require("../models/sale");
const Appointment       = require("../models/appointment");
const AppointmentDetail = require("../models/appointmentDetail");
const ClinicalHistory   = require("../models/clinicalHistory");
const VetSchedule       = require("../models/vetSchedule");
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
        const staff = await Staff.findByPk(id);
        if (!staff) return res.status(404).send({ msg: "Registro no encontrado." });

        // ── Verificar dependencias ────────────────────────────────────────────
        const [ventas, turnosComoVet, turnosComoRegistrador, detallesTurno, historiales, horarios, salarios] = await Promise.all([
            Sale.count({ where: { idPersonal: id } }),
            Appointment.count({ where: { idVeterinario: id } }),
            Appointment.count({ where: { idRegistradoPor: id } }),
            AppointmentDetail.count({ where: { idPersonalRealiza: id } }),
            ClinicalHistory.count({ where: { idVeterinario: id } }),
            VetSchedule.count({ where: { idVeterinario: id } }),
            Salary.count({ where: { idPersonal: id } }),
        ]);

        const total = ventas + turnosComoVet + turnosComoRegistrador + detallesTurno + historiales + horarios + salarios;

        if (total > 0) {
            const detalle = [
                ventas > 0 && `${ventas} venta(s)`,
                (turnosComoVet + turnosComoRegistrador) > 0 && `${turnosComoVet + turnosComoRegistrador} turno(s)`,
                detallesTurno > 0 && `${detallesTurno} detalle(s) de turno`,
                historiales > 0 && `${historiales} historial(es) clínico(s)`,
                horarios > 0 && `${horarios} horario(s) de atención`,
                salarios > 0 && `${salarios} liquidación(es) salarial(es)`,
            ].filter(Boolean).join(", ");

            return res.status(400).send({
                msg: `No se puede eliminar porque tiene registros asociados: ${detalle}. Desactivá la cuenta de acceso en su lugar.`
            });
        }

        // ── Sin dependencias: borrar en el orden correcto ─────────────────────
        const vet         = await Veterinarian.findOne({ where: { idPersonal: id } });
        const idMatricula = vet?.idMatricula || null;
        const idUsuario   = staff.idUsuario  || null;

        // 1. Borrar Veterinarian (libera FK de VETERINARIOS → MATRICULAS)
        if (vet) await Veterinarian.destroy({ where: { idPersonal: id } });

        // 2. Desvincular usuario del staff (rompe FK PERSONAL.idUsuario → USUARIOS)
        //    Usamos update directo en DB para evitar validadores de Sequelize
        await Staff.update({ idUsuario: null }, { where: { idPersonal: id }, validate: false });

        // 3. Borrar Staff (ya no tiene FK hacia USUARIOS)
        await Staff.destroy({ where: { idPersonal: id } });

        // 4. Borrar matrícula huérfana
        if (idMatricula) await ProfessionalCard.destroy({ where: { idMatricula: idMatricula } });

        // 5. Borrar usuario (ya no hay nadie que lo referencie)
        if (idUsuario) await User.destroy({ where: { idUsuario: idUsuario } });

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