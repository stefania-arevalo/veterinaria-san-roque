const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AnimalSize = sequelize.define("AnimalSize", {
    idTamaño: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { type: DataTypes.STRING(20), allowNull: false, unique: true }
}, {
    tableName: "TAMAÑO_ANIMAL",
    timestamps: false,
    hooks: {
        beforeSave: (instance) => {
            if (instance.descripcion) {
                instance.descripcion = instance.descripcion.trim().charAt(0).toUpperCase() + instance.descripcion.trim().slice(1).toLowerCase();
            }
        }
    }
});
module.exports = AnimalSize;