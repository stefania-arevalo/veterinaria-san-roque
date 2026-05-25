const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Staff = require("./staff");

const Assistant = sequelize.define("Assistant", {
    idPersonal: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Staff, key: 'idPersonal' },
        validate: { notEmpty: { msg: "El ID de personal es obligatorio." } },
        isInt: { msg: "El ID de personal debe ser un número entero." }
    },
    certificados: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { len: { args: [0, 255], msg: "El campo certificados excede el límite." } }
    }
}, {
    tableName: "ASISTENTES",
    timestamps: false,
    hooks: {
        beforeValidate: (asist) => {
            if (asist.certificados) {
                asist.certificados = asist.certificados.trim().replace(/\b\w/g, l => l.toUpperCase());
            }
        }
    }
});

Assistant.belongsTo(Staff, { foreignKey: "idPersonal" });
module.exports = Assistant;