const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ServiceAppointmentState = sequelize.define("ServiceAppointmentState", {
    idEstadoServicio: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { 
        type: DataTypes.STRING(50), 
        allowNull: false, 
        unique: { msg: "Este estado ya existe." },
        validate: { notEmpty: { msg: "La descripción es obligatoria." } }
    }
}, { 
    tableName: "ESTADOS_SERVICIOS_CITA", 
    timestamps: false,
    hooks: {
        beforeSave: (instance) => {
            if (instance.descripcion) {
                const text = instance.descripcion.trim();
                instance.descripcion = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            }
        }
    }
});

module.exports = ServiceAppointmentState;