const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Locality = sequelize.define("Locality", {
    idLocalidad: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: "Esta localidad ya existe en el sistema."
        },
        validate: {
            notEmpty: { msg: "El nombre de la localidad no puede estar vacío." },
            len: {
                args: [3, 100],
                msg: "El nombre de la localidad debe tener al menos 3 caracteres."
            }
        }
    }
}, {
    tableName: "LOCALIDADES",
    timestamps: false,
    hooks: {
        beforeValidate: (locality) => {
            if (locality.nombre) {
                // Capitalización: primera letra de cada palabra en mayúscula
                locality.nombre = locality.nombre
                    .trim()
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase());
            }
        }
    }
});

module.exports = Locality;