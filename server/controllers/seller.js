const Seller = require("../models/seller");
const Staff = require("../models/staff");
const User = require("../models/user");
const { Op } = require("sequelize");

// C: Solo Admin
async function createSeller(req, res, next) {
    const { idPersonal } = req.body;
    try {
        const staffMember = await Staff.findByPk(idPersonal, { include: User });
        if (!staffMember || staffMember.User.idRol !== 4) {
            return res.status(403).send({ msg: "El personal debe tener Rol de Vendedor (4)." });
        }
        const seller = await Seller.create({ idPersonal });
        return res.status(201).send(seller);
    } catch (error) {
        next(error);
    }
}

// R: GET ALL (Búsqueda avanzada para todo el Staff)
async function getSellers(req, res, next) {
    const { search } = req.query;
    let whereStaff = {};
    if (search) {
        whereStaff = {
            [Op.or]: [
                { nombres: { [Op.like]: `%${search}%` } },
                { apellidos: { [Op.like]: `%${search}%` } },
                { dni: { [Op.like]: `%${search}%` } },
                { idUsuario: { [Op.like]: `%${search}%` } }
            ]
        };
    }
    try {
        const sellers = await Seller.findAll({
            include: [{ model: Staff, where: whereStaff, attributes: ['nombres', 'apellidos', 'dni', 'correo', 'idUsuario'] }]
        });
        return res.status(200).send(sellers);
    } catch (error) {
        next(error);
    }
}

// R: GET ONE (Cualquier staff con permiso R puede verlo)
async function getSeller(req, res, next) {
    const { id } = req.params;
    try {
        const seller = await Seller.findByPk(id, { include: Staff });
        if (!seller) return res.status(404).send({ msg: "Vendedor no encontrado." });
        
        // Eliminada la restricción de "own" para lectura según tu matriz
        return res.status(200).send(seller);
    } catch (error) {
        next(error);
    }
}


// D: Solo Admin
async function deleteSeller(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Seller.destroy({ where: { idPersonal: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Vendedor eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createSeller, 
    getSellers, 
    getSeller, 
    deleteSeller 
};