const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Locality = require("./locality");
const User = require("./user");
const Salary = require("./salary");

const Staff = sequelize.define("Staff", {
    idPersonal: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: "El nombre es obligatorio." } }
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: "El apellido es obligatorio." } }
    },
    dni: {
        type: DataTypes.STRING(10),
        unique: { msg: "Este DNI ya está registrado en el personal." },
        allowNull: false,
        validate: {
            len: { args: [7, 10], msg: "El DNI debe tener entre 7 y 10 caracteres." },
            isNumeric: { msg: "El DNI debe contener solo números." }
        }
    },
    sexo: {
        type: DataTypes.CHAR(1),
        allowNull: false,
        validate: {
            isIn: {
                args: [['M', 'F', 'O']],
                msg: "El sexo debe ser M (Masculino), F (Femenino) u O (Otro)."
            }
        }
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { isDate: { msg: "Formato de fecha de nacimiento incorrecto." } }
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    correo: {
        type: DataTypes.STRING(100),
        unique: { msg: "Este correo electrónico ya está en uso." },
        validate: { isEmail: { msg: "El formato del correo electrónico no es válido." } }
    },
    idLocalidad: {
        type: DataTypes.INTEGER,
        references: { model: Locality, key: 'idLocalidad' }
    },
    idUsuario: {
        type: DataTypes.INTEGER,
        unique: {
            msg: "Este usuario ya está vinculado a otro miembro del personal."
        },
        references: { 
            model: User, 
            key: 'idUsuario' 
        }
    },
    idSalario: {
        type: DataTypes.INTEGER,
        references: { model: Salary, key: 'idSalario' }
    }
}, {
    tableName: "PERSONAL",
    timestamps: false
});

Staff.associate = (models) => {
    const Veterinarian = require("./veterinarian");
    const Assistant = require("./assistant");
    const Admin = require("./admin");
    const Seller = require("./seller");
    
    Staff.hasOne(Veterinarian, { foreignKey: "idPersonal" });
    Staff.hasOne(Assistant, { foreignKey: "idPersonal" });
    Staff.hasOne(Admin, { foreignKey: "idPersonal" });
    Staff.hasOne(Seller, { foreignKey: "idPersonal" });

    Staff.belongsTo(models.Locality, { foreignKey: "idLocalidad" });
    Staff.belongsTo(models.User, { foreignKey: "idUsuario" });
    Staff.belongsTo(models.Salary, { foreignKey: "idSalario" });
};

module.exports = Staff;