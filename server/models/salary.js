const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Salary = sequelize.define("Salary", {
    idSalario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    fechaLiquidacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: "La fecha debe ser válida (YYYY-MM-DD)." },
            notEmpty: { msg: "La fecha de liquidación es obligatoria." }
        }
    },
    horasTrabajadas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: "Las horas deben ser un número entero." },
            min: { args: [0], msg: "Las horas no pueden ser negativas." }
        }
    },
    tarifaHora: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "La tarifa debe ser un número decimal." },
            min: { args: [0.01], msg: "La tarifa debe ser mayor a 0." }
        }
    },
    idPersonal: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: "SALARIOS",
    timestamps: false
});

Salary.associate = (models) => {
  Salary.belongsTo(models.Staff, { foreignKey: "idPersonal" });
};

module.exports = Salary;