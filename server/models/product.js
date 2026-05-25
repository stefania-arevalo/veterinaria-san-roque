const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Product = sequelize.define("Product", {
    idProducto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del producto es obligatorio." }
        }
    },
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    idCategoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "CATEGORIAS",
            key: "idCategoria"
        }
    },
    idMarca: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "MARCAS",
            key: "idMarca"
        }
    },
    esUsoInterno: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: "PRODUCTOS",
    timestamps: false,
    // El índice asegura que no haya duplicados de Nombre + Marca
    indexes: [
        {
            unique: true,
            fields: ['nombre', 'idMarca'],
            msg: "Ya existe este producto registrado para la marca seleccionada."
        }
    ],
    hooks: {
        beforeValidate: (instance) => {
            if (instance.nombre) {
                // Limpiamos espacios y aplicamos formato "Nombre"
                const clean = instance.nombre.trim();
                if (clean.length > 0) {
                    instance.nombre = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
                }
            }
            if (instance.descripcion) {
                instance.descripcion = instance.descripcion.trim();
            }
        }
    }
});

Product.associate = (models) => {
    // Relaciones base con alias explícitos
    Product.belongsTo(models.Category, { foreignKey: 'idCategoria', as: 'Categoria' });
    Product.hasMany(models.ProductPresentation, { foreignKey: 'idProducto', as: 'Presentaciones' }); 
    Product.hasMany(models.Batch, { foreignKey: 'idProducto', as: 'Lotes' });
    
    // 🔥 LAS 3 RELACIONES QUE FALTABAN:
    Product.belongsTo(models.Brand, { foreignKey: 'idMarca', as: 'Marca' });
    Product.hasOne(models.Medication, { foreignKey: 'idProducto', as: 'Medicamento' });
    Product.hasOne(models.Vaccine, { foreignKey: 'idProducto', as: 'Vacuna' });
};

module.exports = Product;