const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Brand = sequelize.define("Brand", {
    idMarca: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Esta marca ya se encuentra registrada." },
        validate: {
            notEmpty: { msg: "La descripción de la marca es obligatoria." },
            len: { args: [2, 100], msg: "La descripción debe tener entre 2 y 100 caracteres." }
        }
    }
}, {
    tableName: "MARCAS",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                const clean = instance.descripcion.trim();
                // Capitalizamos la primera letra para mantener uniformidad
                instance.descripcion = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
        }
    }
});

module.exports = Brand;