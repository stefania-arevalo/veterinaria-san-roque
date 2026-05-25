const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Role = require("./role"); 

const User = sequelize.define("User", {
    idUsuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    usuario: {
        type: DataTypes.STRING(50),
        unique: {
            msg: "Este nombre de usuario ya está registrado."
        },
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "El nombre de usuario no puede estar vacío."
            },
            len: {
                args: [3, 50],
                msg: "El usuario debe tener entre 3 y 50 caracteres."
            }
        }
    },
    contraseña: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    estado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    idRol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Role,
            key: 'idRol'
        }
    }
}, {
    tableName: "USUARIOS",
    timestamps: false,
    hooks: {
        // ESTO ASEGURA QUE "Stefi" y "stefi" SEAN LO MISMO (Evita duplicados confusos)
        beforeValidate: (user) => {
            if (user.usuario) {
                user.usuario = user.usuario.trim().toLowerCase();
            }
        }
    }
});

User.associate = (models) => {
    // Relación con Rol
    User.belongsTo(models.Role, { foreignKey: "idRol" });
    
    // Relaciones para obtener Nombre/DNI
    User.hasOne(models.Staff, { foreignKey: "idUsuario" });
    User.hasOne(models.Client, { foreignKey: "idUsuario" });
};

module.exports = User;