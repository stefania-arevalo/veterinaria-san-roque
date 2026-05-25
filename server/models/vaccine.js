const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Product = require("./product");

const Vaccine = sequelize.define("Vaccine", {
    idProducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
            model: "PRODUCTOS",
            key: "idProducto"
        }
    },
    dosis: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "La dosis es obligatoria (ej: 0.5 ml o 1 ml)." }
        }
    },
    enfermedadPreventiva: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "Debe especificar la enfermedad que previene." }
        }
    },
    idEspecie: {
        type: DataTypes.INTEGER,
        allowNull: true, // null puede significar "todas las especies"
        references: {
            model: "ESPECIES",
            key: "idEspecie"
        }
    }
}, {
    tableName: "VACUNAS",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.dosis) instance.dosis = instance.dosis.trim();
            if (instance.enfermedadPreventiva) {
                const clean = instance.enfermedadPreventiva.trim();
                instance.enfermedadPreventiva = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
        }
    }
});

Vaccine.associate = (models) => {
    Vaccine.belongsTo(models.Product, { foreignKey: 'idProducto', as: 'Producto' });
};

module.exports = Vaccine;