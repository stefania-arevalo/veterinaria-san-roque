const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const VetSchedule = require("./vetSchedule");

const Schedule = sequelize.define("Schedule", {
    idHorario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    diaSemana: { 
        type: DataTypes.STRING(10), 
        allowNull: false,
        validate: {
            notEmpty: { msg: "El día de la semana no puede estar vacío" },
            len: { args: [2, 10], msg: "El día debe tener entre 2 y 10 caracteres" }
        }
    },
    turno: { 
        type: DataTypes.STRING(20), 
        allowNull: false,
        validate: {
            notEmpty: { msg: "El turno es obligatorio" },
            isIn: { args: [['Mañana', 'Tarde', 'Noche', 'mañana', 'tarde', 'noche']], msg: "Turno no válido" }
        }
    },
    horaInicio: { 
        type: DataTypes.TIME, 
        allowNull: false,
        validate: { notNull: { msg: "La hora de inicio es requerida" } }
    },
    horaFin: { 
        type: DataTypes.TIME, 
        allowNull: false,
        validate: { notNull: { msg: "La hora de fin es requerida" } }
    }
}, { 
    tableName: "HORARIOS_ATENCION", 
    timestamps: false,
    indexes: [
        { 
            unique: true, 
            fields: ['diaSemana', 'turno'] // La combinación es única
        }
    ],
    hooks: {
        beforeSave: (instance) => {
            if (instance.diaSemana) instance.diaSemana = instance.diaSemana.trim().charAt(0).toUpperCase() + instance.diaSemana.trim().slice(1).toLowerCase();
            if (instance.turno) instance.turno = instance.turno.trim().charAt(0).toUpperCase() + instance.turno.trim().slice(1).toLowerCase();
        }
    }
});

Schedule.belongsTo(VetSchedule, { foreignKey: "idHorario" });

module.exports = Schedule;