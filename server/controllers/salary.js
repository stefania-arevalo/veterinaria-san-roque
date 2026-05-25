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
            order: [['fechaLiquidacion', 'DESC']] // Ver primero los más recientes
        });

        if (salaries.length === 0) {
            return res.status(404).send({ msg: "No se encontraron registros salariales con esos criterios." });
        }

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

        // El Administrador es el único que llega aquí (validado en el Router)
        await salaryToUpdate.update(req.body);

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