const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Visitor = sequelize.define("Visitor", {
    idVisitador: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre es obligatorio." }
        }
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El apellido es obligatorio." }
        }
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: { msg: "El formato del correo no es válido." }
        }
    },
    idProveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "PROVEEDORES",
            key: "idProveedor"
        }
    }
}, {
    tableName: "VISITADORES",
    timestamps: false,
    indexes: [
        {
            name: 'unique_visitor_data',
            unique: true,
            // Lista de campos que NO deben repetirse juntos
            fields: ['nombre', 'apellido', 'telefono', 'correo', 'idProveedor'] 
        }
    ],
    hooks: {
        beforeValidate: (instance) => {
            if (instance.nombre) instance.nombre = instance.nombre.trim();
            if (instance.apellido) instance.apellido = instance.apellido.trim();
            if (instance.correo) instance.correo = instance.correo.trim().toLowerCase();
        }
    }
});

module.exports = Visitor;