const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Veterinarian = require("./veterinarian");
const Staff = require("./staff"); 
const Schedule = require("./schedule");

const VetSchedule = sequelize.define("VetSchedule", {
    idVeterinario: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
        validate: { isInt: { msg: "El ID del veterinario debe ser un número entero" } }
    },
    idHorario: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
        validate: { isInt: { msg: "El ID del horario debe ser un número entero" } }
    }
}, { tableName: "HORARIO_VETERINARIO", timestamps: false });

// RELACIÓN VETSCOPE -> VETERINARIAN
// foreignKey: el campo en ESTA tabla (VetSchedule)
// targetKey: el campo en la tabla DESTINO (Veterinarian)
VetSchedule.belongsTo(Veterinarian, { 
    foreignKey: 'idVeterinario', 
    targetKey: 'idPersonal' 
});

Veterinarian.belongsTo(Staff, { foreignKey: "idPersonal" });
VetSchedule.belongsTo(Schedule, { foreignKey: "idHorario" });

module.exports = VetSchedule;