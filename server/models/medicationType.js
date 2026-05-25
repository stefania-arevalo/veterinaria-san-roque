const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const MedicationType = sequelize.define("MedicationType", {
    idTipoMedicacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Este tipo de medicación ya existe." },
        validate: {
            notEmpty: { msg: "La descripción es obligatoria." },
            len: { args: [3, 100], msg: "Debe tener entre 3 y 100 caracteres." }
        }
    }
}, {
    tableName: "TIPOS_MEDICACION",
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

module.exports = MedicationType;