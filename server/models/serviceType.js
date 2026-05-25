const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ServiceType = sequelize.define("ServiceType", {
    idTipoServicio: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    descripcion: { 
        type: DataTypes.STRING(100), 
        allowNull: false,
        unique: { msg: "Este tipo de servicio ya existe." },
        validate: {
            notEmpty: { msg: "La descripción no puede estar vacía" },
            len: { args: [3, 100], msg: "Debe tener entre 3 y 100 caracteres" }
        }
    }
}, { 
    tableName: "TIPOS_SERVICIO", 
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                const clean = instance.descripcion.trim();
                instance.descripcion = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
        }
    }
});

module.exports = ServiceType;