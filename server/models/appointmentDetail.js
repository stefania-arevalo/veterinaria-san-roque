const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AppointmentDetail = sequelize.define("AppointmentDetail", {
    idDetalle: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    idCita: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'CITAS', key: 'idCita' }
    },
    idPrecioServicio: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PRECIOS_SERVICIO', key: 'idPrecioServicio' }
    },
    idPersonalRealiza: { 
        type: DataTypes.INTEGER, 
        allowNull: true, 
        references: { model: 'PERSONAL', key: 'idPersonal' }
    },
    idEstadoServicio: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        defaultValue: 1,
        references: { model: 'ESTADOS_SERVICIOS_CITA', key: 'idEstadoServicio' }
    },
    observaciones: { type: DataTypes.STRING(255), allowNull: true },
    idCitaNueva: { 
        type: DataTypes.INTEGER, 
        allowNull: true, // Permitimos nulo porque no todos se reprograman
        references: { model: 'CITAS', key: 'idCita' }
    },
}, { 
    tableName: "DETALLE_CITA_SERVICIO", 
    timestamps: false 
});

AppointmentDetail.associate = (models) => {
    AppointmentDetail.belongsTo(models.Appointment, { 
      foreignKey: "idCita", 
      as: "Cita" 
    });
    AppointmentDetail.belongsTo(models.Appointment, { 
      foreignKey: "idCitaNueva", 
      as: "CitaNueva" 
    });
    AppointmentDetail.belongsTo(models.ServicePrice, { 
      foreignKey: "idPrecioServicio", 
      as: "PrecioServicio" 
    });
    AppointmentDetail.belongsTo(models.Staff, { 
      foreignKey: "idPersonalRealiza", 
      as: "Ejecutor" 
    });
    AppointmentDetail.belongsTo(models.ServiceAppointmentState, { 
      foreignKey: "idEstadoServicio",
      as: "EstadoServicio"
    });
};

module.exports = AppointmentDetail;