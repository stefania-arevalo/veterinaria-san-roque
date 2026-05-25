const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Provider = sequelize.define("Provider", {
    idProveedor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    razonSocial: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: "La razón social es obligatoria." }
        }
    },
    cuit: {
        type: DataTypes.STRING(13),
        allowNull: false,
        unique: { msg: "Este CUIT ya se encuentra registrado." },
        validate: {
            notEmpty: { msg: "el CUIT es obligatorio." }
        }
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    direccion: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: { msg: "El formato del correo electrónico no es válido." }
        }
    },
    idLocalidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "LOCALIDADES", 
            key: "idLocalidad"
        }
    }
}, {
    tableName: "PROVEEDORES",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.razonSocial) instance.razonSocial = instance.razonSocial.trim();
            if (instance.correo) instance.correo = instance.correo.trim().toLowerCase();
            if (instance.cuit) instance.cuit = instance.cuit.trim();
        }
    }
});

module.exports = Provider;