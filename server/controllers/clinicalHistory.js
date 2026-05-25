const ClinicalHistory = require("../models/clinicalHistory");
const Appointment = require("../models/appointment"); 
const PetState = require("../models/petState");
const Veterinarian = require("../models/veterinarian");
const Staff        = require("../models/staff");
const Pet      = require("../models/pet");
const Client   = require("../models/client");
const Breed    = require("../models/breed");

async function createHistory(req, res, next) {
    try {
        const history = await ClinicalHistory.create(req.body);
        return res.status(201).send(history);
    } catch (error) {
        next(error);
    }
}

async function getAllHistories(req, res, next) {
    try {
        const list = await ClinicalHistory.findAll({
            // Usamos 'include' para traer los datos de la tabla CITAS
            include: [
                { 
                    model: Appointment, 
                    as: 'Cita',  
                    attributes: ['fecha', 'hora'], 
                    include: [{
                        model: Pet, as: "Mascota",
                        include: [
                        { model: Client, as: "Dueño" },
                        { model: Breed,  as: "Raza"  },
                        ]
                    }] 
                },
            
                { model: PetState, as: 'EstadoMascota', attributes: ['descripcion'] },
                {
                    model: Pet, as: "Mascota",
                    include: [
                      { model: Client, as: "Dueño" },
                      { model: Breed,  as: "Raza"  },
                    ]
                },
                { 
                    model: Veterinarian, 
                    as: 'Veterinario',
                    attributes: ['idPersonal'],
                    include: [{ 
                        model: Staff, 
                        as: undefined,           // Veterinarian.belongsTo(Staff) sin alias
                        attributes: ['nombres', 'apellidos'] 
                    }]
                }
        ],
            order: [['idHistorial', 'DESC']]
        });
        return res.status(200).send(list);
    } catch (error) {
        next(error);
    }
}

async function getHistory(req, res, next) {
    try {
        const { id } = req.params;
        const history = await ClinicalHistory.findByPk(id);
        if (!history) return res.status(404).send({ msg: "Registro clinico no encontrado." });
        return res.status(200).send(history);
    } catch (error) {
        next(error);
    }
}

async function updateHistory(req, res, next) {
    try {
        const { id } = req.params;
        const history = await ClinicalHistory.findByPk(id);
        if (!history) return res.status(404).send({ msg: "El historial no existe." });

        let hasChanges = false;
        const fields = ['peso', 'temperatura', 'motivo', 'sintomas', 'diagnostico', 'idEstadoMascota', 'idMascota', 'idVeterinario', 'idCita'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (String(history[field]) !== String(req.body[field])) {
                    hasChanges = true;
                }
            }
        });

        if (!hasChanges) {
            return res.status(400).send({ msg: "No se detectaron cambios en la ficha para actualizar." });
        }

        await history.update(req.body);
        return res.status(200).send({ msg: "Historial actualizado correctamente.", history });
    } catch (error) {
        next(error);
    }
}
async function deleteHistory(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await ClinicalHistory.destroy({ where: { idHistorial: id } });
        
        if (deleted === 0) return res.status(404).send({ msg: "No se encontro el registro a eliminar." });
        
        return res.status(200).send({ msg: "Registro de historial eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createHistory,
    getAllHistories,
    getHistory,
    updateHistory,
    deleteHistory
};