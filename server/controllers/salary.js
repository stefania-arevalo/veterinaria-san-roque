const Salary = require("../models/salary");
const Staff  = require("../models/staff");   
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

    // Filtro own: si no es admin, solo ve sus propias liquidaciones
    // SALARIOS no tiene idUsuario — filtramos por idPersonal del staff vinculado al usuario
    if (req.user.idRol !== 1) {
        const myStaff = await Staff.findOne({ where: { idUsuario: req.user.user_id } });
        if (!myStaff) return res.status(200).send([]); // no tiene personal asociado
        whereClause.idPersonal = myStaff.idPersonal;
    }

    if (idSalario) {
        if (isNaN(idSalario)) return res.status(400).send({ msg: "El ID de salario debe ser numérico." });
        whereClause.idSalario = idSalario;
    }

    if (fecha) {
        whereClause.fechaLiquidacion = { [Op.like]: `%${fecha}%` };
    }

    try {
        const salaries = await Salary.findAll({
            where: whereClause,
            include: [{
                model: Staff,
                attributes: ["idPersonal", "nombres", "apellidos", "dni"],
                required: false,   // ← LEFT JOIN: no descarta salarios con staff borrado
            }],
            order: [["fechaLiquidacion", "DESC"]]
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
        if (!salaryToUpdate) return res.status(404).send({ msg: "El registro salarial no existe." });

        const { tarifaHora, horasTrabajadas } = req.body;
        const payload = {};
        if (tarifaHora      !== undefined) payload.tarifaHora     = tarifaHora;
        if (horasTrabajadas !== undefined) payload.horasTrabajadas = horasTrabajadas;

        if (Object.keys(payload).length === 0)
            return res.status(400).send({ msg: "No se enviaron campos válidos para actualizar." });

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
        if (deletedRows === 0) return res.status(404).send({ msg: "El registro salarial no existe." });
        return res.status(200).send({ msg: "Registro salarial eliminado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = { createSalary, getSalaries, updateSalary, deleteSalary };