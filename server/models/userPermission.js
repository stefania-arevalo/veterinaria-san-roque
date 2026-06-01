const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const UserPermission = sequelize.define("UserPermission", {
  idPermiso: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "USUARIOS", key: "idUsuario" },
  },
  pagina: {
    type: DataTypes.STRING, // o Sequelize.STRING dependiendo de cómo lo importes
    allowNull: false,
    validate: {
      isIn: {
        args: [[
          "ventas", 
          "compras", 
          "clientes", 
          "citas", 
          "pacientes", 
          "historial_clinico", 
          "inventario", 
          "usuarios",     
          "permisos",     
          "configuracion", 
          "reportes"
        ]],
        msg: "La página especificada no es válida."
      }
    }
  },
  habilitado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: "PERMISOS_USUARIO",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ["idUsuario", "pagina"], // Un usuario no puede tener dos registros para la misma página
    },
  ],
});

UserPermission.associate = (models) => {
  UserPermission.belongsTo(models.User, {
    foreignKey: "idUsuario",
    as: "Usuario",
  });
};

module.exports = UserPermission;