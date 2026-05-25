const ProfessionalCard = require("../models/professionalCard");
const Veterinarian = require("../models/veterinarian");
const Staff = require("../models/staff");

async function createCard(req, res, next) {
    try {
        const card = await ProfessionalCard.create(req.body);
        return res.status(201).send(card);
    } catch (error) {
        next(error);
    }
}

async function getCards(req, res, next) {
    try {
        const cards = await ProfessionalCard.findAll({});
        return res.status(200).send(cards);
    } catch (error) {
        next(error);
    }
}

async function updateCard(req, res, next) {
    const { id } = req.params; 
    
    try {
        const cardExists = await ProfessionalCard.findByPk(id);
        if (!cardExists) return res.status(404).send({ msg: "La matrícula no existe." });

        // REGLA U(own): Si es Veterinario (Rol 2)
        if (req.user.idRol === 2) {
            const ownership = await Veterinarian.findOne({
                where: { idMatricula: id },
                include: {
                    model: Staff,
                    where: { idUsuario: req.user.user_id }
                }
            });

            if (!ownership) {
                return res.status(403).send({ msg: "Solo puedes modificar tu propia matrícula." });
            }
        }

        const [updatedRows] = await ProfessionalCard.update(req.body, { where: { idMatricula: id } });

        if (updatedRows === 0) {
            return res.status(400).send({ msg: "No se realizaron cambios (datos idénticos)." });
        }

        return res.status(200).send({ msg: "Matrícula actualizada correctamente." });

    } catch (error) {
        next(error);
    }
}

async function deleteCard(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await ProfessionalCard.destroy({ where: { idMatricula: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Matrícula no encontrada." });
        
        return res.status(200).send({ msg: "Matrícula eliminada permanentemente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createCard, 
    getCards, 
    updateCard, 
    deleteCard 
};