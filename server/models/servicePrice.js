const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Service = require("./service");
const AnimalSize = require("./animalSize");

const ServicePrice = sequelize.define("ServicePrice", {
    idPrecioServicio: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    idServicio: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'SERVICIOS', key: 'idServicio' },
        validate: {
            async exists(value) {
                const exists = await Service.findByPk(value);
                if (!exists) throw new Error("El servicio seleccionado no existe.");
            }
        }
    },
    idTamaño: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'TAMAÑO_ANIMAL', key: 'idTamaño' },
        validate: {
            async exists(value) {
                const exists = await AnimalSize.findByPk(value);
                if (!exists) throw new Error("El tamaño de animal seleccionado no existe.");
            }
        }
    },
    precio: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false,
        validate: {
            isDecimal: true,
            min: { args: [0.01], msg: "El precio debe ser mayor a 0." }
        }
    },
    duracionEstimada: { 
        type: DataTypes.INTEGER,
        validate: {
            isInt: true,
            min: { args: [1], msg: "La duración debe ser al menos de 1 minuto." }
        }
    }
}, { 
    tableName: "PRECIOS_SERVICIO", 
    timestamps: false 
});

// Relaciones
ServicePrice.belongsTo(Service, { foreignKey: 'idServicio', as: 'Service' });
ServicePrice.belongsTo(AnimalSize, { foreignKey: 'idTamaño', as: 'AnimalSize' });

module.exports = ServicePrice;