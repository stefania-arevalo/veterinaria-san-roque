const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PurchaseDetail = sequelize.define("PurchaseDetail", {
    idDetalleCompra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idCompra: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'COMPRAS', key: 'idCompra' }
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'PRODUCTOS', key: 'idProducto' }
    },
    idProductoPresentacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'PRODUCTOS_PRESENTACIONES', key: 'idProdPres' }
    },
    idLote: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'LOTES', key: 'idLote' }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: "La cantidad debe ser un numero entero." },
            min: { args: [1], msg: "La cantidad minima es 1." }
        }
    },
    precioUnidad: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El precio debe ser un numero decimal." },
            min: { args: [0], msg: "El precio no puede ser negativo." }
        }
    }
}, {
    tableName: "DETALLE_COMPRA",
    timestamps: false
});

PurchaseDetail.associate = (models) => {
    PurchaseDetail.belongsTo(models.Purchase,            { foreignKey: "idCompra",               as: "Cabecera" });
    PurchaseDetail.belongsTo(models.Product,             { foreignKey: "idProducto",             as: "Producto" });
    PurchaseDetail.belongsTo(models.ProductPresentation, { foreignKey: "idProductoPresentacion", as: "Presentacion" });
    PurchaseDetail.belongsTo(models.Batch,               { foreignKey: "idLote",                 as: "Lote" });
};
  

module.exports = PurchaseDetail;