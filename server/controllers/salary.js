const Salary = require("../models/salary");
const { Op } = require("sequelize");

async function createSalary(req, res, next) {
    try {
        const salary = await Salary.create(req.body);
        return res.status(201).send(salary);
    } catch (error) {
        next(error);
    }
}

async function getSalaries(req, res, next) {
    const { idSalario, fecha } = req.query;
    let whereClause = {};

    // --- LÓGICA DE SEGURIDAD (Own) ---
    // Si el usuario NO es Administrador (Rol 1), forzamos que solo vea lo suyo.
    // Importante: Esta lógica asume que en el modelo existe 'idUsuario' como FK.
    if (req.user.idRol !== 1) {
        whereClause.idUsuario = req.user.user_id; 
    }

    // --- LÓGICA DE BÚSQUEDA ---
    if (idSalario) {
        if (isNaN(idSalario)) return res.status(400).send({ msg: "El ID de salario debe ser numérico." });
        whereClause.idSalario = idSalario;
    }

    if (fecha) {
        // Buscamos coincidencias exactas o parciales de fecha
        whereClause.fechaLiquidacion = { [Op.like]: `%${fecha}%` };
    }

    try {
        const salaries = await Salary.findAll({ 
            where: whereClause,
            include: [{
                model: Staff,
                attributes: ["idPersonal", "nombres", "apellidos", "dni"],
            }],
            order: [['fechaLiquidacion', 'DESC']]
        });

        return res.status(200).send(salaries);
    } catch (error) {
        next(error);
    }
}

async function updateSalary(req, res, next) {
    const { id } = req.params;
    try {
        const salaryToUpdate = await Salary.findByPk(id);
        if (!salaryToUpdate) {
            return res.status(404).send({ msg: "El registro salarial no existe." });
        }
 
        // CORRECCIÓN: solo permitir editar tarifa y horas — nunca período ni empleado
        const { tarifaHora, horasTrabajadas } = req.body;
        const payload = {};
        if (tarifaHora      !== undefined) payload.tarifaHora      = tarifaHora;
        if (horasTrabajadas !== undefined) payload.horasTrabajadas  = horasTrabajadas;
 
        if (Object.keys(payload).length === 0) {
            return res.status(400).send({ msg: "No se enviaron campos válidos para actualizar." });
        }
 
        await salaryToUpdate.update(payload);
        return res.status(200).send({ msg: "Salario actualizado correctamente." });
 
    } catch (error) {
        next(error);
    }
}
 

async function deleteSalary(req, res, next) {
    const { id } = req.params;
    try {
        const deletedRows = await Salary.destroy({ where: { idSalario: id } });
        
        if (deletedRows === 0) {
            return res.status(404).send({ msg: "El registro salarial no existe." });
        }

        return res.status(200).send({ msg: "Registro salarial eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createSalary, 
    getSalaries, 
    updateSalary, 
    deleteSalary 
};