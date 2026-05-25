const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Batch = sequelize.define("Batch", {
    idLote: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "PRODUCTOS",
            key: "idProducto"
        }
    },
    idProd_Pres: { 
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: "PRODUCTOS_PRESENTACIONES",
            key: "idProdPres"
        }
    },
    codigoLote: { 
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El código de lote del fabricante es obligatorio." }
        }
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    cantidadDisponible: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [0], msg: "El stock no puede ser negativo." }
        }
    }
}, {
    tableName: "LOTES",
    timestamps: false
});

Batch.associate = (models) => {
    Batch.belongsTo(models.Product, { foreignKey: 'idProducto', as: 'Producto' });
};

module.exports = Batch;