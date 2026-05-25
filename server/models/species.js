const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Species = sequelize.define("Species", {
    idEspecie: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false, unique: true }
}, {
    tableName: "ESPECIES",
    timestamps: false,
    hooks: {
        beforeSave: (instance) => {
            if (instance.nombre) {
                instance.nombre = instance.nombre.trim().charAt(0).toUpperCase() + instance.nombre.trim().slice(1).toLowerCase();
            }
        }
    }
});
module.exports = Species;