const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Presentation = sequelize.define("Presentation", {
    idPresentacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El tipo de envase es obligatorio." }
        }
    },
    concentracion: {
        type: DataTypes.STRING(50),
        allowNull: true // Puede haber productos sin concentración específica
    },
    formato: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El formato (ej: comprimido) es obligatorio." }
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: "La cantidad debe ser un número entero." },
            min: { args: [1], msg: "La cantidad debe ser al menos 1." }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: "PRESENTACIONES",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.tipo) {
                const clean = instance.tipo.trim();
                instance.tipo = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
            if (instance.formato) {
                const clean = instance.formato.trim();
                instance.formato = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
            if (instance.concentracion) {
                instance.concentracion = instance.concentracion.trim();
            }
        }
    }
});

Presentation.associate = (models) => {
    // Una presentación puede estar en muchos productos
    Presentation.hasMany(models.ProductPresentation, { foreignKey: 'idPresentacion' });
};

module.exports = Presentation;