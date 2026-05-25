const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Staff = require("./staff");
const ProfessionalCard = require("./professionalCard");

const Veterinarian = sequelize.define("Veterinarian", {
    idPersonal: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        references: { model: Staff, key: 'idPersonal' },
        validate: {
            notEmpty: { msg: "El ID de personal es obligatorio." }
        },
        isInt: { msg: "El ID de personal debe ser un número entero." }
    },
    especialidad: { 
        type: DataTypes.STRING(100), 
        allowNull: false,
        validate: {
            notEmpty: { msg: "La especialidad no puede estar vacía." },
            len: { args: [3, 100], msg: "La especialidad debe tener entre 3 y 100 caracteres." }
        }
    },
    idMatricula: { 
        type: DataTypes.INTEGER, 
        unique: { msg: "Esta matrícula ya está asignada a otro veterinario." }, 
        allowNull: false, 
        references: { model: ProfessionalCard, key: 'idMatricula' } 
    }
}, {
    tableName: "VETERINARIOS",
    timestamps: false,
    hooks: {
        beforeValidate: (vet) => {
            if (vet.especialidad) {
                vet.especialidad = vet.especialidad.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
        }
    }
});

Veterinarian.belongsTo(Staff, { foreignKey: "idPersonal" });
Veterinarian.belongsTo(ProfessionalCard, { foreignKey: "idMatricula" });

module.exports = Veterinarian;