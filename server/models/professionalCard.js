const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ProfessionalCard = sequelize.define("ProfessionalCard", {
    idMatricula: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: false, 
        allowNull: false,
        validate: {
            notEmpty: { msg: "El número de matrícula es obligatorio." },
            isInt: { msg: "El número de matrícula debe ser un valor numérico." }
        }
    },
    fechaExpedicion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "La fecha de expedición no es válida." },
            notEmpty: { msg: "La fecha de expedición es obligatoria." }
        }
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "La fecha de vencimiento no es válida." },
            notEmpty: { msg: "La fecha de vencimiento es obligatoria." },
            isAfterExpedition(value) {
                if (value <= this.fechaExpedicion) {
                    throw new Error('La fecha de vencimiento debe ser posterior a la de expedición.');
                }
            }
        }
    }
}, {
    tableName: "MATRICULAS",
    timestamps: false
});

module.exports = ProfessionalCard;