const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaymentType = sequelize.define("PaymentType", {
    idTipoPago: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Este tipo de pago ya existe." }, 
        validate: {
            notEmpty: { msg: "La descripcion del tipo de pago es obligatoria." },
            len: { args: [3, 50], msg: "La descripcion debe tener entre 3 y 50 caracteres." }
        }
    }
}, {
    tableName: "TIPOS_PAGO",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) instance.descripcion = instance.descripcion.trim();
        },
        beforeSave: (instance) => {
            if (instance.descripcion) {
                // Formateo: Primera letra en mayúscula, el resto en minúscula
                instance.descripcion = instance.descripcion.trim().charAt(0).toUpperCase() + instance.descripcion.trim().slice(1).toLowerCase();
            }
        }
    }
});

module.exports = PaymentType;