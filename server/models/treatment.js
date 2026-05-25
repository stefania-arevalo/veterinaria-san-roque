const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const TreatmentType  = require("./treatmentType");
const TreatmentState = require("./treatmentState");

const Treatment = sequelize.define("Treatment", {
    idTratamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "La fecha de inicio no es valida." },
            notNull: { msg: "La fecha de inicio es obligatoria." }
        }
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true 
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: "La descripcion del tratamiento es obligatoria." }
        }
    },
    idHistorial: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "HISTORIAL_CLINICO",
            key: "idHistorial"
        }
    },
    idTipoTratamiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "TIPOS_TRATAMIENTO",
            key: "idTipoTratamiento"
        }
    },
    idEstadoTratamiento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "ESTADOS_TRATAMIENTO",
            key: "idEstadoTratamiento"
        }
    }
}, {
    tableName: "TRATAMIENTOS",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.descripcion) instance.descripcion = instance.descripcion.trim();
        }
    }
});

Treatment.belongsTo(TreatmentType,  { foreignKey: 'idTipoTratamiento', as: 'TipoTratamiento' });
Treatment.belongsTo(TreatmentState, { foreignKey: 'idEstadoTratamiento', as: 'EstadoTratamiento' });

module.exports = Treatment;