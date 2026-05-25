const Admin = require("../models/admin");
const Staff = require("../models/staff");
const User = require("../models/user");
const Role = require("../models/role"); 
const { Op } = require("sequelize");

async function createAdmin(req, res, next) {
    try {
        const staffMember = await Staff.findByPk(req.body.idPersonal, { include: User });
        if (!staffMember || staffMember.User.idRol !== 1) {
            return res.status(403).send({ msg: "El personal debe tener asignado el Rol de Administrador." });
        }
        const admin = await Admin.create(req.body);
        return res.status(201).send(admin);
    } catch (error) {
        next(error);
    }
}

async function getAdmins(req, res, next) {
    const { area } = req.query;
    let whereClause = {};
    if (area) whereClause.areaResponsabilidad = { [Op.like]: `%${area}%` };

    try {
        // Incluimos de forma profunda para que la lista también tenga el Rol
        const admins = await Admin.findAll({ 
            where: whereClause, 
            include: [{
                model: Staff,
                include: [{
                    model: User,
                    include: [{ model: Role }],
                    attributes: { exclude: ["contraseña"] }
                }]
            }] 
        });
        return res.status(200).send(admins);
    } catch (error) {
        next(error);
    }
}

async function getAdmin(req, res, next) {
    const { id } = req.params;
    try {
        // Buscamos por la clave primaria de Admin (findByPk) para evitar confusiones de ID.
        // Si tu ruta /admin/:id recibe el idPersonal en lugar del idAdmin, cambia 'findByPk(id...' por:
        // findOne({ where: { idPersonal: id }, ... })
        const admin = await Admin.findByPk(id, {
            include: [{
                model: Staff,
                include: [{
                    model: User,
                    // CORRECCIÓN CLAVE: Traemos el modelo Role anidado dentro de User
                    include: [{ model: Role }], 
                    attributes: { exclude: ["contraseña"] }
                }]
            }]
        });

        if (!admin) return res.status(404).send({ msg: "Administrador no encontrado." });
        return res.status(200).send(admin);
    } catch (error) {
        next(error);
    }
}

async function updateAdmin(req, res, next) {
    const { id } = req.params;
    try {
        const admin = await Admin.findByPk(id); // Consistente con buscar por su PK
        if (!admin) return res.status(404).send({ msg: "No encontrado." });
        await admin.update(req.body);
        return res.status(200).send({ msg: "Área actualizada correctamente." });
    } catch (error) {
        next(error);
    }
}

async function deleteAdmin(req, res, next) {
    const { id } = req.params;
    try {
        // Usamos findByPk para asegurar la existencia antes de destruir, o directo por PK
        const admin = await Admin.findByPk(id);
        if (!admin) return res.status(404).send({ msg: "No encontrado." });
        
        await admin.destroy();
        return res.status(200).send({ msg: "Rango de administrador revocado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createAdmin, 
    getAdmins, 
    getAdmin, 
    updateAdmin, 
    deleteAdmin 
};