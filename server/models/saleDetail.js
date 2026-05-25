const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SaleDetail = sequelize.define("SaleDetail", {
    idDetalleVenta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idVenta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'VENTAS', key: 'idVenta' }
    },
    idProducto: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'PRODUCTOS', key: 'idProducto' }
    },
    idDetalleCitaServicio: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'DETALLE_CITA_SERVICIO', key: 'idDetalle' }
    },
    idTratMed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
    },
    idVacunaAplicada: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'VACUNAS_APLICADAS', key: 'idVacunaAplicada' }
    },
    idLote: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
    tableName: "DETALLE_VENTA",
    timestamps: false
});

SaleDetail.associate = (models) => {
    SaleDetail.belongsTo(models.Sale,              { foreignKey: "idVenta",                as: "Cabecera" });
    SaleDetail.belongsTo(models.Product,           { foreignKey: "idProducto",             as: "Producto" });
    SaleDetail.belongsTo(models.Batch,             { foreignKey: "idLote",                 as: "Lote" });
    SaleDetail.belongsTo(models.AppointmentDetail, { foreignKey: "idDetalleCitaServicio",  as: "DetalleCita" });
    SaleDetail.belongsTo(models.TreatmentMedication, { foreignKey: "idTratMed",             as: "MedicamentoTratamiento" });
    SaleDetail.belongsTo(models.AppliedVaccine, { foreignKey: "idVacunaAplicada", as: "DetalleVacuna" });
};
  
  
module.exports = SaleDetail;