const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TreatmentType = sequelize.define("TreatmentType", {
    idTipoTratamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Este tipo de tratamiento ya existe." },
        validate: {
            notEmpty: { msg: "El nombre no puede estar vacío." },
            len: { args: [3, 50], msg: "El nombre debe tener entre 3 y 50 caracteres." }
        }
    },
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: "La descripción es obligatoria." }
        }
    }
}, {
    tableName: "TIPOS_TRATAMIENTO",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.nombre) {
                const clean = instance.nombre.trim();
                instance.nombre = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
            if (instance.descripcion) {
                instance.descripcion = instance.descripcion.trim();
            }
        }
    }
});

module.exports = TreatmentType;