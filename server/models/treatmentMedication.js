const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Product = require("./product");
const ProductPresentation = require("./productPresentation");

const TreatmentMedication = sequelize.define("TreatmentMedication", {
    idTratMed: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idTratamiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "TRATAMIENTOS",
            key: "idTratamiento"
        },
        validate: {
            notNull: { msg: "El id de tratamiento es obligatorio." }
        }
    },
    idProd_Pres: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "PRODUCTOS_PRESENTACIONES",
            key: "idProdPres"
        },
        validate: {
            notNull: { msg: "La presentacion del producto es obligatoria." }
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: "La cantidad debe ser un numero entero." },
            min: { args: [1], msg: "La cantidad debe ser al menos 1." }
        }
    },
    precioAplicado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Segun tu tabla no tiene NOT NULL
        validate: {
            isDecimal: { msg: "El precio debe ser un numero decimal." }
        }
    },
    notas: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    instrucciones: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "Las instrucciones de dosis y horarios son obligatorias." }
        }
    },
    aplicadoEnClinica: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isIn: { args: [[0, 1]], msg: "El valor debe ser 0 (para llevar) o 1 (aplicado en clinica)." }
        }
    },
}, {
    tableName: "TRATAMIENTO_MEDICAMENTO",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.notas) instance.notas = instance.notas.trim();
            if (instance.instrucciones) instance.instrucciones = instance.instrucciones.trim();
        }
    }
});

TreatmentMedication.belongsTo(ProductPresentation, {
    foreignKey: "idProd_Pres",
    as: "PresentacionProducto"
  });
module.exports = TreatmentMedication;