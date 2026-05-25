const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Vaccine = require("./vaccine");
const Batch = require("./batch");
const ClinicalHistory = require("./clinicalHistory");


const AppliedVaccine = sequelize.define("AppliedVaccine", {
    idVacunaAplicada: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idHistorial: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "HISTORIAL_CLINICO",
            key: "idHistorial"
        },
        validate: {
            notNull: { msg: "El id de historial es obligatorio." },
            isInt: { msg: "El id de historial debe ser un numero entero." }
        }
    },
    idVacuna: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "VACUNAS",
            key: "idProducto"
        },
        validate: {
            notNull: { msg: "El id de vacuna es obligatorio." },
            isInt: { msg: "El id de vacuna debe ser un numero entero." }
        }
    },
    idLote: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "LOTES",
            key: "idLote"
        },
        validate: {
            notNull: { msg: "El id de lote es obligatorio." },
            isInt: { msg: "El id de lote debe ser un numero entero." }
        }
    },
    dosis: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El campo dosis no puede estar vacio." },
            len: { args: [1, 50], msg: "La dosis debe tener entre 1 y 50 caracteres." }
        }
    },
    fechaAplicacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "El formato de fecha no es valido (YYYY-MM-DD)." },
            notNull: { msg: "La fecha de aplicacion es obligatoria." }
        }
    },
    precioAplicado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    },
    cobrada: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: "VACUNAS_APLICADAS",
    timestamps: false,
    hooks: {
        beforeValidate: (instance) => {
            if (instance.dosis) instance.dosis = instance.dosis.trim();
        }
    }
});

AppliedVaccine.belongsTo(Vaccine, { foreignKey: 'idVacuna', as: 'Vacuna' });
AppliedVaccine.belongsTo(Batch,   { foreignKey: 'idLote',   as: 'Lote'   });
AppliedVaccine.belongsTo(ClinicalHistory, { foreignKey: 'idHistorial', as: 'Historial' });

module.exports = AppliedVaccine;