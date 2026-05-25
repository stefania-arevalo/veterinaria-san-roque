const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Staff = require("./staff");

const Seller = sequelize.define("Seller", {
    idPersonal: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Staff, key: 'idPersonal' },
        validate: {
            notEmpty: { msg: "El ID de personal es obligatorio para crear un vendedor." },
            isInt: { msg: "El ID de personal debe ser un número entero." }
        }
    }
}, { 
    tableName: "VENDEDORES", 
    timestamps: false 
});

Seller.belongsTo(Staff, { foreignKey: "idPersonal" });

module.exports = Seller;