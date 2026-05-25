const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Product = require("./product");

const Medication = sequelize.define("Medication", {
    idProducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
            model: "PRODUCTOS",
            key: "idProducto"
        }
    },
    idTipoMedicacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "TIPOS_MEDICACION",
            key: "idTipoMedicacion"
        }
    },
    ventaLibre: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: "MEDICAMENTOS",
    timestamps: false
});

Medication.associate = (models) => {
    Medication.belongsTo(models.Product, { foreignKey: 'idProducto', as: 'Producto' });
};
Medication.associate = (models) => {
    // Si en Product usas el alias "Medicamento", aquí mapeamos que pertenece a Product
    Medication.belongsTo(models.Product, { foreignKey: 'idProducto', as: 'Producto' });
};

module.exports = Medication;