const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Client = require("./client");
const Breed = require("./breed");
const AnimalSize = require("./animalSize");

const Pet = sequelize.define("Pet", {
    idMascota: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false },
    sexo: { type: DataTypes.CHAR(1), allowNull: false }, // M/H
    fechaNac: { type: DataTypes.DATE, allowNull: true },
    colores: { type: DataTypes.STRING(50), allowNull: true },
    idCliente: { type: DataTypes.INTEGER, allowNull: false },
    idRaza: { type: DataTypes.INTEGER, allowNull: false },
    idTamaño: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: "MASCOTAS",
    timestamps: false,
    hooks: {
        beforeSave: (pet) => {
            if (pet.nombre) {
                pet.nombre = pet.nombre.trim().charAt(0).toUpperCase() + pet.nombre.trim().slice(1).toLowerCase();
            }
        }
    }
});

Pet.associate = (models) => {
    Pet.belongsTo(models.Client, { foreignKey: "idCliente", as: 'Dueño' });
    Pet.belongsTo(models.Breed, { foreignKey: "idRaza", as: "Raza"});
    Pet.belongsTo(models.AnimalSize, { foreignKey: "idTamaño" });
    Pet.hasMany(models.Appointment, { foreignKey: "idMascota", as: "Citas" });
};

module.exports = Pet;