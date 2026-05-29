const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Veterinarian = sequelize.define("Veterinarian", {
    idPersonal: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        allowNull: false,
        validate: {
            notEmpty: { msg: "El ID de personal es obligatorio." },
            isInt: { msg: "El ID de personal debe ser un número entero." }
        }
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
        allowNull: false
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


Veterinarian.associate = (models) => {
    // Relación de herencia/identidad con Personal
    Veterinarian.belongsTo(models.Staff, { foreignKey: "idPersonal" });
    
    // Relación con su Matrícula Profesional
    Veterinarian.belongsTo(models.ProfessionalCard, { foreignKey: "idMatricula" });
    
    // Relación con la tabla intermedia de horarios
    Veterinarian.hasMany(models.VetSchedule, { foreignKey: "idVeterinario" });
};

module.exports = Veterinarian;