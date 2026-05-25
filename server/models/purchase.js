const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Purchase = sequelize.define("Purchase", {
    idCompra: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "El formato de fecha no es válido." }
        }
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    descuento: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "El descuento no puede ser negativo." }
        }
    },
    iva: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    idPersonal: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PERSONAL', key: 'idPersonal' }
    },
    idProveedor: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PROVEEDORES', key: 'idProveedor' }
    },
    idVisitador: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: { model: 'VISITADORES', key: 'idVisitador' }
    },
    idTipoPago: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'TIPOS_PAGO', key: 'idTipoPago' }
    },
    idTipoBoleta: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'TIPO_BOLETA', key: 'idTipoBoleta' }
    }
}, {
    tableName: "COMPRAS",
    timestamps: false
});

Purchase.associate = (models) => {
    Purchase.belongsTo(models.Staff,         { foreignKey: "idPersonal",   as: "Comprador" });
    Purchase.belongsTo(models.Provider,      { foreignKey: "idProveedor",  as: "Proveedor" });
    Purchase.belongsTo(models.Visitor,       { foreignKey: "idVisitador",  as: "Visitador" });
    Purchase.belongsTo(models.PaymentType,   { foreignKey: "idTipoPago",   as: "FormaPago" });
    Purchase.belongsTo(models.ReceiptType,   { foreignKey: "idTipoBoleta", as: "TipoComprobante" });
    Purchase.hasMany(models.PurchaseDetail,  { foreignKey: "idCompra",     as: "detalles" });
};
  
 

module.exports = Purchase;