const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SaleState = sequelize.define("SaleState", {
    idEstadoVenta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: { msg: "Este estado de venta ya existe." }, 
        validate: {
            notEmpty: { msg: "La descripcion del estado de venta es obligatoria." },
            len: { args: [3, 50], msg: "La descripcion debe tener entre 3 y 50 caracteres." }
        }
    }
}, {
    tableName: "ESTADOS_VENTA",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                
                instance.descripcion = instance.descripcion.trim().charAt(0).toUpperCase() + 
                                       instance.descripcion.trim().slice(1).toLowerCase();
            }
        }
    }
});

module.exports = SaleState;