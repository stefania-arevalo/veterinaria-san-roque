const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Category = sequelize.define("Category", {
    idCategoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: { msg: "Esta categoría ya existe." },
        validate: {
            notEmpty: { msg: "La descripción de la categoría es obligatoria." },
            len: { args: [3, 100], msg: "La descripción debe tener entre 3 y 100 caracteres." }
        }
    }
}, {
    tableName: "CATEGORIAS",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                const clean = instance.descripcion.trim();
                instance.descripcion = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
            }
        }
    }
});

Category.associate = (models) => {
    Category.hasMany(models.Product, { foreignKey: 'idCategoria' });
};

module.exports = Category;