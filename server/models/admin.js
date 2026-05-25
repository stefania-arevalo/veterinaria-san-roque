const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Staff = require("./staff");

const Admin = sequelize.define("Admin", {
    idPersonal: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: Staff, key: 'idPersonal' },
        validate: { notEmpty: { msg: "El ID de personal es obligatorio." } }
    },
    areaResponsabilidad: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El área de responsabilidad es obligatoria." },
            len: { args: [3, 100], msg: "El área debe tener entre 3 y 100 caracteres." }
        }
    }
}, { 
    tableName: "ADMINISTRADORES", 
    timestamps: false,
    hooks: {
        beforeValidate: (admin) => {
            if (admin.areaResponsabilidad) {
                admin.areaResponsabilidad = admin.areaResponsabilidad.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
            }
        }
    }
});

Admin.belongsTo(Staff, { foreignKey: "idPersonal" });

module.exports = Admin;