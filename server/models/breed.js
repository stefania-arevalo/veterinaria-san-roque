const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Species = require("./species");

const Breed = sequelize.define("Breed", {
    idRaza: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    idEspecie: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: Species, key: 'idEspecie' }
    }
}, {
    tableName: "RAZAS",
    timestamps: false,
    indexes: [{ unique: true, fields: ['nombre', 'idEspecie'] }], // No permite "Siamés" - "Gato" dos veces
    hooks: {
        beforeSave: (breed) => {
            if (breed.nombre) {
                breed.nombre = breed.nombre.trim().charAt(0).toUpperCase() + breed.nombre.trim().slice(1).toLowerCase();
            }
        }
    }
});

Breed.belongsTo(Species, { foreignKey: "idEspecie", as: 'Especie' });
module.exports = Breed;