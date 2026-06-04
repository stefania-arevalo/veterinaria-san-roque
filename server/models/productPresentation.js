const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ProductPresentation = sequelize.define("ProductPresentation", {
    idProdPres: {
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
    idPresentacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "PRESENTACIONES",
            key: "idPresentacion"
        }
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: { args: [0], msg: "El precio no puede ser negativo." }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: "PRODUCTOS_PRESENTACIONES",
    timestamps: false,
    indexes: [
        {
            name: 'idx_prod_pres_unique', 
            unique: true,
            fields: ['idProducto', 'idPresentacion'],
            msg: "Esta presentación ya está asignada a este producto."
        }
    ]
});

// ─── ASOCIACIONES DE MODELOS ─────────────────────────────────────────────────
ProductPresentation.associate = (models) => {
    // Conecta con el producto (Agregado alias explícito 'Product' si tu arquitectura lo requiere, o se mantiene por defecto)
    ProductPresentation.belongsTo(models.Product, { foreignKey: 'idProducto' });
    
    // Conecta con la presentación (tipo, formato, etc.)
    ProductPresentation.belongsTo(models.Presentation, { foreignKey: 'idPresentacion', as: 'Presentacion'});
};

module.exports = ProductPresentation;