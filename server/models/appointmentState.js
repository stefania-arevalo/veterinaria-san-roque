const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AppointmentState = sequelize.define("AppointmentState", {
    idEstadoCita: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    descripcion: { 
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: { msg: "Este estado de cita ya se encuentra registrado." }, 
        validate: {
            notEmpty: { msg: "La descripción es obligatoria" },
            len: { args: [3, 50], msg: "Debe tener entre 3 y 50 caracteres" }
        }
    }
}, { 
    tableName: "ESTADOS_CITA", 
    timestamps: false,
    hooks: {
        beforeSave: (instance) => {
            if (instance.descripcion) {
                const clean = instance.descripcion.trim();
                instance.descripcion = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
        }
    }
});

module.exports = AppointmentState;