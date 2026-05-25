const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Appointment = require("./appointment");
const PetState = require("./petState");
const Veterinarian = require("./veterinarian"); 
const Pet = require("./pet");

const ClinicalHistory = sequelize.define("ClinicalHistory", {
    idHistorial: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    peso: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            isDecimal: { msg: "El peso debe ser un numero decimal (ej: 12.50)." },
            min: { args: [0.1], msg: "El peso debe ser mayor a 0." }
        }
    },
    temperatura: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        validate: {
            isDecimal: { msg: "La temperatura debe ser un numero decimal (ej: 38.5)." },
            min: { args: [20], msg: "Temperatura fuera de rango logico." },
            max: { args: [50], msg: "Temperatura fuera de rango logico." }
        }
    },
    motivo: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El motivo de la visita es obligatorio." },
            len: { args: [3, 255], msg: "El motivo debe tener entre 3 y 255 caracteres." }
        }
    },
    sintomas: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            notEmpty: { msg: "Debe registrar los sintomas observados." }
        }
    },
    diagnostico: { 
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "El diagnostico medico es obligatorio." }
        }
    },
    idVeterinario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "VETERINARIOS",
            key: "idPersonal"
        }
    },
    idMascota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "MASCOTAS",
            key: "idMascota"
        }
    },
    idCita: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "CITAS",
            key: "idCita"
        }
    },
    idEstadoMascota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "ESTADOS_MASCOTA",
            key: "idEstadoMascota"
        }
    }
}, {
    tableName: "HISTORIAL_CLINICO",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.motivo) instance.motivo = instance.motivo.trim();
            if (instance.sintomas) instance.sintomas = instance.sintomas.trim();
            if (instance.diagnostico) instance.diagnostico = instance.diagnostico.trim();
        }
    }
});

ClinicalHistory.belongsTo(Appointment, { foreignKey: 'idCita', as: 'Cita' });
ClinicalHistory.belongsTo(PetState, { foreignKey: 'idEstadoMascota', as: 'EstadoMascota' });
ClinicalHistory.belongsTo(Veterinarian, { foreignKey: 'idVeterinario', as: 'Veterinario' });
ClinicalHistory.belongsTo(Pet, { foreignKey: 'idMascota', as: 'Mascota' });

module.exports = ClinicalHistory;