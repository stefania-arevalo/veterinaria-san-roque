const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const ServiceType = require("./serviceType");

const Service = sequelize.define("Service", {
    idServicio: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    descripcion: { 
        type: DataTypes.STRING(150), 
        allowNull: false,
        unique: { msg: "Este servicio ya está registrado." },
        validate: {
            notEmpty: { msg: "La descripción es obligatoria." },
            len: { args: [3, 150], msg: "La descripción debe tener entre 3 y 150 caracteres." }
        }
    },
    idTipoServicio: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        validate: {
            async exists(value) {
                const type = await ServiceType.findByPk(value);
                if (!type) {
                    throw new Error("El Tipo de Servicio seleccionado no existe.");
                }
            }
        }
    }
}, { 
    tableName: "SERVICIOS", 
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) {
                const clean = instance.descripcion.trim();
                instance.descripcion = clean.charAt(0).toUpperCase() + 
                                       clean.slice(1).toLowerCase();
            }
        }
    }
});

// Relación: Un Servicio PERTENECE a un Tipo de Servicio
Service.belongsTo(ServiceType, { foreignKey: 'idTipoServicio', as: 'ServiceType' });

module.exports = Service;