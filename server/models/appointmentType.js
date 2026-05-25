const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AppointmentType = sequelize.define("AppointmentType", {
    idTipoCita: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    descripcion: { 
        type: DataTypes.STRING(50), 
        allowNull: false,
        unique: { msg: "Este tipo de cita ya se encuentra registrado." }, 
        validate: {
            notEmpty: { msg: "La descripción no puede estar vacía" },
            len: { args: [3, 50], msg: "La descripción debe tener entre 3 y 50 caracteres" }
        }
    }
}, { 
    tableName: "TIPOS_CITA", 
    timestamps: false,
    hooks: {
        beforeSave: (instance) => {
            if (instance.descripcion) {
                // Formateo: Primera letra en mayúscula, el resto en minúscula
                instance.descripcion = instance.descripcion.trim().charAt(0).toUpperCase() + instance.descripcion.trim().slice(1).toLowerCase();
            }
        }
    }
});

module.exports = AppointmentType;