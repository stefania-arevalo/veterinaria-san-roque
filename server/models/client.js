const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Locality = require("./locality");
const User = require("./user");

const Client = sequelize.define("Client", {
    idCliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    dni: {
        type: DataTypes.STRING(10),
        unique: true,
        allowNull: false,
    },
    sexo: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        validate: {
            isIn: { args: [['M', 'F']], msg: "El sexo debe ser M o F." }
        }
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    correo: {
        type: DataTypes.STRING(100),
        unique: false,
        allowNull: true, 
    },
    idLocalidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Locality, key: 'idLocalidad' }
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        allowNull: true, // Un cliente puede no tener cuenta de usuario todavía
        unique: true,
        references: { model: User, key: 'idUsuario' }
    }
}, {
    tableName: "CLIENTES",
    timestamps: false
});

Client.associate = (models) => {
    Client.belongsTo(models.Locality, { foreignKey: "idLocalidad" });
    Client.belongsTo(models.User, { foreignKey: "idUsuario" });
};

module.exports = Client;