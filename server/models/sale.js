const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Sale = sequelize.define("Sale", {
    idVenta: {
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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    },
    idPersonal: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PERSONAL', key: 'idPersonal' }
    },
    idCliente: { 
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: { model: 'CLIENTES', key: 'idCliente' }
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
    },
    idEstadoVenta: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'ESTADOS_VENTA', key: 'idEstadoVenta' }
    }
}, {
    tableName: "VENTAS",
    timestamps: false
});

Sale.associate = (models) => {
    Sale.belongsTo(models.Staff,       { foreignKey: "idPersonal",    as: "Vendedor" });
    Sale.belongsTo(models.Client,      { foreignKey: "idCliente",     as: "Cliente" });
    Sale.belongsTo(models.PaymentType, { foreignKey: "idTipoPago",    as: "FormaPago" });
    Sale.belongsTo(models.ReceiptType, { foreignKey: "idTipoBoleta",  as: "TipoComprobante" });
    Sale.belongsTo(models.SaleState,   { foreignKey: "idEstadoVenta", as: "EstadoVenta" });
    Sale.hasMany(models.SaleDetail,    { foreignKey: "idVenta",       as: "detalles" });
};
  
module.exports = Sale;