const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ReceiptType = sequelize.define("ReceiptType", {
    idTipoBoleta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Este tipo de boleta ya existe." }, 
        validate: {
            notEmpty: { msg: "La descripcion del tipo de boleta es obligatoria." },
            len: { args: [2, 50], msg: "La descripcion debe tener entre 2 y 50 caracteres." }
        }
    }
}, {
    tableName: "TIPO_BOLETA",
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

module.exports = ReceiptType;