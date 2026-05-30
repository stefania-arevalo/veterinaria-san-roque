const { DataTypes } = require("sequelize");
const sequelize = require("../db");

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
}, { 
    tableName: "HORARIO_VETERINARIO", 
    timestamps: false 
});


VetSchedule.associate = (models) => {
    // RELACIÓN VET_SCHEDULE -> VETERINARIAN (o Staff, verifica el nombre exacto de tu modelo de veterinarios)
    VetSchedule.belongsTo(models.Veterinarian, { 
        foreignKey: 'idVeterinario', 
        targetKey: 'idPersonal' 
    });

    // RELACIÓN VET_SCHEDULE -> SCHEDULE (Crucial para traer las horas desde la tabla intermedia)
    VetSchedule.belongsTo(models.Schedule, { 
        foreignKey: "idHorario",
        as: "HorarioDetail" // Un alias ayuda a identificarlo en el include
    });
};
module.exports = VetSchedule;