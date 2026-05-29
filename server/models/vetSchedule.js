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
    
    // RELACIÓN VET_SCHEDULE -> VETERINARIAN
    VetSchedule.belongsTo(models.Veterinarian, { 
        foreignKey: 'idVeterinario', 
        targetKey: 'idPersonal' 
    });

    // RELACIÓN VET_SCHEDULE -> SCHEDULE
    VetSchedule.belongsTo(models.Schedule, { 
        foreignKey: "idHorario" 
    });
};

module.exports = VetSchedule;