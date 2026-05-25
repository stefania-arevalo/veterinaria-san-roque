const { DataTypes } = require("sequelize");
const sequelize = require("../db");

// Función auxiliar para capitalizar texto ("admin" -> "Admin", "juan perez" -> "Juan Perez")
const capitalizeWords = (str) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const Role = sequelize.define("Role", {
    idRol: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: "Este rol ya existe en el sistema."
        },
        validate: {
            notEmpty: {
                msg: "La descripción del rol no puede estar vacía."
            },
            len: {
                args: [2, 50],
                msg: "La descripción debe tener entre 2 y 50 caracteres."
            }
        }
    }
}, {
    tableName: "ROLES",
    timestamps: false,
    hooks: {
        // Se ejecuta antes de validar (funciona tanto en create como en update)
        beforeValidate: (role) => {
            if (role.descripcion) {
                role.descripcion = capitalizeWords(role.descripcion.trim());
            }
        }
    }
});

module.exports = Role;