const sequelize = require("../db");
const { isEditable } = require('../utils/appointmentHelpers');
const ServicePrice = require("../models/servicePrice");
const Service = require("../models/service");
const AnimalSize = require("../models/animalSize");
const Appointment = require("../models/appointment");
const AppointmentDetail = require("../models/appointmentDetail");
const { Op } = require("sequelize");

async function createAppointmentDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { AppointmentDetail, Appointment } = sequelize.models;
        const { idCita, idPrecioServicio } = req.body;
        
        // 1. Buscamos la cita padre primero
        const cita = await Appointment.findByPk(idCita, { transaction: t });

        // 2. Si no existe la cita, cortamos acá
        if (!cita) {
            await t.rollback();
            return res.status(404).send({ msg: "La cita especificada no existe." });
        }

        // 3. Validamos el estado (aquí ya tenemos el objeto 'cita' disponible)
        if (!isEditable(cita.idEstadoCita)) {
            await t.rollback(); 
            return res.status(403).send({ msg: "No puedes agregar detalles a una cita Finalizada o Cancelada." });
        }

        // 4. Verificamos duplicados (tu lógica original)
        const existe = await AppointmentDetail.findOne({ where: { idCita, idPrecioServicio }, transaction: t });
        if (existe) { 
            await t.rollback(); 
            return res.status(400).send({ msg: "Este servicio ya fue agregado a la cita anteriormente" }); 
        }
        
        // 5. Creamos el detalle
        const detail = await AppointmentDetail.create(req.body, { transaction: t });
        await t.commit();
        return res.status(201).send(detail);
        
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function getAppointmentDetailsByCita(req, res, next) {
    try {
        const { AppointmentDetail, ServicePrice, Staff } = sequelize.models;
        const { idCita } = req.params;
        
        const details = await AppointmentDetail.findAll({ 
            where: { idCita },
            include: [
                {
                    model: ServicePrice,
                    as: 'PrecioServicio', 
                    include: [
                        { 
                            model: Service,
                            as: 'Service',
                            attributes: ['idServicio', 'descripcion', 'idTipoServicio']
                        },
                        { 
                            model: AnimalSize, 
                            as: 'AnimalSize', 
                            attributes: ['descripcion'] 
                        }
                    ]
                },

                { model: Staff, as: 'Ejecutor', attributes: ['nombres', 'apellidos'] },
                {
                    model: Appointment,
                    as: 'CitaNueva',
                    attributes: ['idCita', 'fecha'],
                    required: false,
                    foreignKey: 'idCitaNueva'
                  }
            ]
        });


        return res.status(200).send(details);

    } catch (error) {
        next(error);
    }
}

async function getAppointmentDetail(req, res, next) {
    try {
        const { id } = req.params;
        const models = sequelize.models;

        const detail = await models.AppointmentDetail.findByPk(id, {
            include: [
                { 
                    model: models.Staff, 
                    as: 'Ejecutor', 
                    attributes: ['nombres', 'apellidos'] 
                },
                { 
                    model: models.ServicePrice, 
                    as: 'PrecioServicio', 
                    attributes: ['idServicio', 'precio'] 
                },
                { 
                    model: models.ServiceAppointmentState, 
                    as: 'EstadoServicio', // AHORA COINCIDE CON EL INDEX.JS
                    attributes: ['descripcion'] 
                }
            ]
        });

        if (!detail) return res.status(404).send({ msg: "Detalle no encontrado." });
        
        return res.status(200).send(detail);

    } catch (error) {
        next(error);
    }
}

async function updateAppointmentDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { AppointmentDetail, Appointment } = sequelize.models;
        
        // 1. Buscamos el detalle incluyendo la cita padre
        const detail = await AppointmentDetail.findByPk(req.params.id, { 
            include: [{ model: Appointment, as: 'Cita' }], 
            transaction: t 
        });

        if (!detail) { 
            await t.rollback(); 
            return res.status(404).send({ msg: "Detalle no encontrado." }); 
        }

       // 2. Validamos el estado de la cita padre usando el alias correcto "Cita"
        if (!isEditable(detail.Cita.idEstadoCita)) {
            await t.rollback(); 
            return res.status(403).send({ msg: "No puedes modificar detalles de una cita Finalizada o Cancelada." });
        }

        // 3. Si todo está bien, actualizamos
        await detail.update(req.body, { transaction: t });
        await t.commit();
        return res.status(200).send({ msg: "Actualizado correctamente." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function deleteAppointmentDetail(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const deleted = await sequelize.models.AppointmentDetail.destroy({ where: { idDetalle: req.params.id }, transaction: t });
        if (deleted === 0) { await t.rollback(); return res.status(404).send({ msg: "No encontrado." }); }
        await t.commit();
        return res.status(200).send({ msg: "Eliminado." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function completeService(req, res, next) {
    try {
        const { idDetalle } = req.params;
        const { idEstadoServicio, idPersonalRealiza } = req.body;

        const nuevoEstado = parseInt(idEstadoServicio);

        const detalle = await AppointmentDetail.findByPk(idDetalle);
        if (!detalle) return res.status(404).send({ msg: "Servicio no encontrado" });

        const datosActualizar = { idEstadoServicio: nuevoEstado };
        
        // Mantenemos el personal si no se envía uno nuevo
        if (idPersonalRealiza) {
            datosActualizar.idPersonalRealiza = idPersonalRealiza;
        }

        await detalle.update(datosActualizar);

        // Lógica de finalizar cita automática
        if (nuevoEstado === 3) {
            const todos = await AppointmentDetail.findAll({ where: { idCita: detalle.idCita } });
            // Verificamos si todos están Realizados (3) o Cancelados (6)
            const todosFin = todos.every(d => [3, 5, 6, 7].includes(parseInt(d.idEstadoServicio)));
            
            if (todosFin) {
                await Appointment.update({ idEstadoCita: 4 }, { where: { idCita: detalle.idCita } });
            }
        }

        // DEVOLVEMOS EL DETALLE (Esto quita el error de la consola)
        return res.status(200).send({ 
            msg: "Servicio actualizado correctamente",
            detalle 
        });
    } catch (error) {
        next(error);
    }
}

async function rescheduleService(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { idDetalle } = req.params;
        const { nuevaFecha, nuevaHora, idPersonalRealiza } = req.body;
    
        // 1. Buscar el detalle original con su cita padre
        const detalleOriginal = await AppointmentDetail.findByPk(idDetalle, {
        include: [{ model: Appointment, as: "Cita" }],
        transaction: t
        });
    
        if (!detalleOriginal) {
        await t.rollback();
        return res.status(404).send({ msg: "Detalle no encontrado." });
        }
    
        // 2. Validar que no esté ya realizado o pagado
        if ([3, 5].includes(detalleOriginal.idEstadoServicio)) {
        await t.rollback();
        return res.status(400).send({ msg: "No se puede reprogramar un servicio ya realizado o pagado." });
        }
    
        const citaOriginal = detalleOriginal.Cita;
    
        // 3. Crear nueva cita con los datos de la original + nueva fecha/hora
        const nuevaCita = await Appointment.create({
        fecha:          nuevaFecha,
        hora:           nuevaHora,
        idMascota:      citaOriginal.idMascota,
        idTipoCita:     citaOriginal.idTipoCita,
        idVeterinario:  citaOriginal.idVeterinario,
        idEstadoCita:   1, // Pendiente
        idRegistradoPor: citaOriginal.idRegistradoPor,
        }, { transaction: t });
    
        // 4. Crear nuevo detalle en la nueva cita
        await AppointmentDetail.create({
        idCita:           nuevaCita.idCita,
        idPrecioServicio: detalleOriginal.idPrecioServicio,
        idPersonalRealiza: idPersonalRealiza || detalleOriginal.idPersonalRealiza,
        idEstadoServicio: 1, // Pendiente
        observaciones:    detalleOriginal.observaciones,
        }, { transaction: t });
    
        // 5. Marcar el detalle original como cancelado (6)
        await detalleOriginal.update({ idEstadoServicio: 6 }, { transaction: t });
    
        // 6. Si TODOS los detalles de la cita original están cancelados,
        //    cancelar también la cita original
        const todosDetalles = await AppointmentDetail.findAll({
        where: { idCita: citaOriginal.idCita },
        transaction: t
        });
        const todosCancelados = todosDetalles.every(d => d.idEstadoServicio === 6);
        if (todosCancelados) {
        await Appointment.update(
            { idEstadoCita: 3 },
            { where: { idCita: citaOriginal.idCita }, transaction: t }
        );
        }
    
        await t.commit();
        return res.status(201).send({
        msg: "Servicio reprogramado correctamente.",
        nuevaCita: nuevaCita.idCita
        });
    
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function vincularReagenda(req, res, next) {
    try {
      const { id } = req.params;
      const { idCitaNueva } = req.body;
      const detalle = await AppointmentDetail.findByPk(id);
      if (!detalle) return res.status(404).send({ msg: "Detalle no encontrado." });
      await detalle.update({ idCitaNueva });
      return res.status(200).send({ msg: "Reagenda vinculada." });
    } catch (error) { next(error); }
  }



module.exports = {
    createAppointmentDetail,
    getAppointmentDetailsByCita,
    getAppointmentDetail,
    updateAppointmentDetail,
    deleteAppointmentDetail,
    completeService,
    rescheduleService,
    vincularReagenda
  };
