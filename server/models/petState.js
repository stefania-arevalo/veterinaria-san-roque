const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Ajustado a tu ruta "../db" según tu ejemplo

const PetState = sequelize.define("PetState", {
    idEstadoMascota: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { 
            msg: "Este estado de mascota ya se encuentra registrado." 
        },
        validate: {
            notEmpty: { msg: "La descripción no puede estar vacía." },
            len: { 
                args: [3, 50], 
                msg: "La descripción debe tener entre 3 y 50 caracteres." 
            }
        }
    }
}, {
    tableName: "ESTADOS_MASCOTA",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                // Quitamos espacios, pasamos todo a minúscula y capitalizamos la primera
                const clean = instance.descripcion.trim();
                if (clean.length > 0) {
                    instance.descripcion = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
                }
            }
        }
    }
});

module.exports = PetState;