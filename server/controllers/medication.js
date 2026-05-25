const Medication = require("../models/medication");

async function createMedication(req, res, next) {
    try {
        const medication = await Medication.create(req.body);
        return res.status(201).send(medication);
    } catch (error) {
        next(error);
    }
}

async function getMedications(req, res, next) {
    try {
        const medications = await Medication.findAll();
        return res.status(200).send(medications);
    } catch (error) {
        next(error);
    }
}

async function getMedication(req, res, next) {
    try {
        const { id } = req.params;
        const medication = await Medication.findByPk(id);
        if (!medication) return res.status(404).send({ msg: "Medicamento no encontrado." });
        return res.status(200).send(medication);
    } catch (error) {
        next(error);
    }
}

async function updateMedication(req, res, next) {
    try {
        const { id } = req.params;
        const { idTipoMedicacion, ventaLibre } = req.body;

        const medication = await Medication.findByPk(id);
        if (!medication) return res.status(404).send({ msg: "El medicamento no existe." });

        // Validación de "No cambios"
        // Nota: Usamos !== undefined porque ventaLibre es booleano (false es un valor válido)
        const newTipo = idTipoMedicacion !== undefined ? Number(idTipoMedicacion) : medication.idTipoMedicacion;
        const newVentaLibre = ventaLibre !== undefined ? ventaLibre : medication.ventaLibre;

        if (medication.idTipoMedicacion === newTipo && medication.ventaLibre === newVentaLibre) {
            return res.status(400).send({ 
                msg: "No se realizaron cambios: los datos son idénticos a los actuales." 
            });
        }

        await medication.update({ 
            idTipoMedicacion: newTipo, 
            ventaLibre: newVentaLibre 
        });

        return res.status(200).send({ msg: "Medicamento actualizado correctamente.", medication });

    } catch (error) {
        next(error);
    }
}

async function deleteMedication(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await Medication.destroy({ where: { idProducto: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Registro de medicamento eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createMedication,
    getMedications,
    getMedication,
    updateMedication,
    deleteMedication
};