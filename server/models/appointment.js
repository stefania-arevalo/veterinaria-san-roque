const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Appointment = sequelize.define("Appointment", {
    idCita: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    idMascota: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'MASCOTAS', key: 'idMascota' },
        validate: {
            async exists(value) {
                // Se requiere el modelo aquí adentro para evitar bucles de importación
                const Pet = sequelize.models.Pet; 
                const exists = await Pet.findByPk(value);
                if (!exists) throw new Error("La mascota seleccionada no existe.");
            }
        }
    },
    idTipoCita: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'TIPOS_CITA', key: 'idTipoCita' },
        validate: {
            async exists(value) {
                const AppointmentType = sequelize.models.AppointmentType;
                const exists = await AppointmentType.findByPk(value);
                if (!exists) throw new Error("El tipo de cita no existe.");
            }
        }
    },
    idEstadoCita: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'ESTADOS_CITA', key: 'idEstadoCita' },
        validate: {
            async exists(value) {
                const AppointmentState = sequelize.models.AppointmentState;
                const exists = await AppointmentState.findByPk(value);
                if (!exists) throw new Error("El estado de cita no existe.");
            }
        }
    },
    idRegistradoPor: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PERSONAL', key: 'idPersonal' },
        validate: {
            async isStaff(value) {
                const Staff = sequelize.models.Staff;
                const exists = await Staff.findByPk(value);
                if (!exists) throw new Error("El registrador debe ser personal de la clínica.");
            }
        }
    },
    idVeterinario: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: 'PERSONAL', key: 'idPersonal' },
        validate: {
            async isVeterinarian(value) {
                const Staff = sequelize.models.Staff;
                const vet = await Staff.findByPk(value);
                // Si usas roles, aquí podrías validar si vet.idRol es de veterinario
                if (!vet) throw new Error("El personal seleccionado debe ser un Veterinario válido.");
            }
        }
    }
}, { 
    tableName: "CITAS", 
    timestamps: false,
    hooks: {
        beforeUpdate: (instance) => {
            if (instance.changed('idRegistradoPor')) {
                throw new Error("No se permite modificar el usuario que registró la cita original.");
            }
        }
    }
});

Appointment.associate = (models) => {
  Appointment.belongsTo(models.Staff, { foreignKey: "idRegistradoPor", as: "Registrador" });
  Appointment.belongsTo(models.Staff, { foreignKey: "idVeterinario",   as: "Veterinario" });
  Appointment.belongsTo(models.Pet,             { foreignKey: "idMascota",    as: "Mascota" });
  Appointment.belongsTo(models.AppointmentType, { foreignKey: "idTipoCita",   as: "TipoCita" });
  Appointment.belongsTo(models.AppointmentState,{ foreignKey: "idEstadoCita", as: "EstadoCita" });
  Appointment.hasMany(models.AppointmentDetail, { foreignKey: "idCita",       as: "detalles" });
};

module.exports = Appointment;