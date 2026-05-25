const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TreatmentState = sequelize.define("TreatmentState", {
    idEstadoTratamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Este estado de tratamiento ya existe." },
        validate: {
            notEmpty: { msg: "La descripción no puede estar vacía." },
            len: { args: [3, 50], msg: "La descripción debe tener entre 3 y 50 caracteres." }
        }
    }
}, {
    tableName: "ESTADOS_TRATAMIENTO",
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

module.exports = TreatmentState;