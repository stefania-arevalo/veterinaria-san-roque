const { Op } = require("sequelize");
const sequelize = require("../db");
const { isEditable } = require('../utils/appointmentHelpers');

// Importaciones iniciales
const Appointment = require("../models/appointment");
const AppointmentDetail = require("../models/appointmentDetail");
const ServicePrice = require("../models/servicePrice");
const Staff = require("../models/staff");
const VetSchedule = require("../models/vetSchedule");
const Schedule = require("../models/schedule");
const Pet = require("../models/pet");
const Client = require("../models/client"); 
const Breed = require("../models/breed");
const Species = require("../models/species");
const AppointmentType = require("../models/appointmentType"); 
const AppointmentState = require("../models/appointmentState");

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getDiaSemana(fechaStr) {
    const partes = fechaStr.split('-');
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return dias[fecha.getDay()];
}

async function calcularDuracion(servicios, idTipoCita) {
    if (servicios && servicios.length > 0) {
        const ids = servicios.map(s => s.idPrecioServicio);
        const precios = await ServicePrice.findAll({ 
            where: { idPrecioServicio: ids },
            attributes: ['duracionEstimada'] 
        });
        const total = precios.reduce((sum, p) => sum + (p.duracionEstimada || 0), 0);
        return total > 0 ? total : 30;
    }
    return [2, 4].includes(parseInt(idTipoCita)) ? 10 : 30;
}

async function checkVetAvailability(fecha, hora, idVeterinario, idTipoCita, duracionMinutos, idCitaActual = null) {
    const newStart = timeToMinutes(hora);
    const newEnd = newStart + duracionMinutos;
    const dia = getDiaSemana(fecha);

    const schedules = await VetSchedule.findAll({ 
        where: { idVeterinario }, 
        include: [{ model: Schedule }] 
    });
    
    const atiendeHoy = schedules.some(s => 
        s.Schedule.diaSemana.toLowerCase() === dia.toLowerCase() &&
        newStart >= timeToMinutes(s.Schedule.horaInicio) && 
        newEnd <= timeToMinutes(s.Schedule.horaFin)
    );

    if (!atiendeHoy) return { isValid: false, msg: `El veterinario no atiende el ${dia} en ese horario.` };

    const where = { fecha, idVeterinario };
    if (idCitaActual) where.idCita = { [Op.ne]: idCitaActual };

    // Buscamos citas existentes incluyendo los detalles para calcular duración real
    const citasExistentes = await Appointment.findAll({ 
        where,
        include: [{
            model: AppointmentDetail,
            as: 'detalles', // ALIAS REQUERIDO
            include: [{ model: ServicePrice, as: 'PrecioServicio' }] // ALIAS REQUERIDO
        }]
    });

    for (let cita of citasExistentes) {
        const s = timeToMinutes(cita.hora);
        let duracionExistente = 0;
        
        if (cita.detalles && cita.detalles.length > 0) {
            duracionExistente = cita.detalles.reduce((acc, det) => acc + (det.PrecioServicio?.duracionEstimada || 0), 0);
        }
        
        if (duracionExistente === 0) duracionExistente = 30; 
        const e = s + duracionExistente;

        if (newStart < e && newEnd > s) {
            return { 
                isValid: false, 
                msg: `Conflicto: Ya hay una cita de ${cita.hora} a ${minutesToTime(e)}.` 
            };
        }
    }
    return { isValid: true };
}

async function createAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { fecha, hora, idMascota, idTipoCita, idEstadoCita, idVeterinario, servicios } = req.body;

        // 1. VALIDACIÓN PRIMARIA: ¿Existe el veterinario y tiene el rol correcto?
        const vet = await Staff.findByPk(idVeterinario, {
            include: [{
                model: sequelize.models.User,
                as: 'User' // Asegúrate de que este alias coincida con tu modelo Staff/User
            }]
        });

        if (!vet) {
            await t.rollback();
            return res.status(404).send({ msg: `No existe un personal con el ID ${idVeterinario}.` });
        }

        // Suponiendo que el idRol del Veterinario es 2 (ajustalo según tu BD)
        if (!vet.User || vet.User.idRol !== 2) {
            await t.rollback();
            return res.status(400).send({ msg: "El ID proporcionado no corresponde a un Veterinario activo." });
        }

        // 2. Cálculo de duración
        const duracionNueva = await calcularDuracion(servicios, idTipoCita);
        
        // 3. Verificación de disponibilidad horaria
        const availability = await checkVetAvailability(fecha, hora, idVeterinario, idTipoCita, duracionNueva);
        
        if (!availability.isValid) {
            await t.rollback();
            return res.status(400).send({ msg: availability.msg });
        }

        // 4. Creación de la cita
        const appointment = await Appointment.create({
            fecha, hora, idMascota, idTipoCita, idVeterinario,
            idEstadoCita: idEstadoCita || 1,
            idRegistradoPor: req.user.idPersonal,
        }, { transaction: t });

        // 5. Creación de detalles
        if (servicios && servicios.length > 0) {
            const detalles = servicios.map(s => ({
                idCita: appointment.idCita,
                idPrecioServicio: s.idPrecioServicio,
                idPersonalRealiza: s.idPersonalRealiza || idVeterinario,
                idEstadoServicio: s.idEstadoServicio || 1,
                observaciones: s.observaciones
            }));
            
            await AppointmentDetail.bulkCreate(detalles, { transaction: t });
        }

        await t.commit();
        return res.status(201).send(appointment);
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function getAppointments(req, res, next) {
    try {
        const { date } = req.query;
        const { idRol, user_id } = req.user; // Obtenemos el usuario logueado
        let whereClause = {};
        
        if (date) whereClause.fecha = date;

        // SI ES CLIENTE: Solo puede ver sus citas
        if (idRol === 5) {
            const client = await Client.findOne({ where: { idUsuario: user_id } });
            if (!client) return res.status(200).send([]);
            
            // Buscamos las mascotas del cliente para filtrar las citas
            const myPets = await Pet.findAll({ where: { idCliente: client.idCliente } });
            const myPetIds = myPets.map(p => p.idMascota);
            whereClause.idMascota = { [Op.in]: myPetIds };
        }

        const appointments = await Appointment.findAll({ 
            where: whereClause,
            include: [
                { model: Staff, as: 'Registrador', attributes: ['nombres', 'apellidos'] },
                { model: Staff, as: 'Veterinario', attributes: ['nombres', 'apellidos'] },
                { 
                    model: Pet, 
                    as: 'Mascota',
                    attributes: ['idMascota', 'nombre', 'idTamaño', 'idRaza'], // ← agregás idRaza
                    include: [
                        { model: Client, as: 'Dueño', attributes: ['nombres', 'apellidos'] },
                        // ↓ esto es lo que faltaba
                        { 
                            model: Breed, 
                            as: 'Raza',         
                            attributes: ['idRaza', 'nombre', 'idEspecie'] 
                        }
                    ]
                },
                { model: AppointmentType, as: 'TipoCita' },
                { model: AppointmentState, as: 'EstadoCita' },
                
                // --- INICIO DE LA CORRECCIÓN ---
                // Aquí incluimos los detalles, el personal que ejecuta y el servicio
                {
                    model: AppointmentDetail,
                    as: 'detalles',
                    include: [
                        { 
                            model: Staff, 
                            as: 'Ejecutor', 
                            // Renombramos 'nombres' a 'nombre' para que coincida con tu frontend
                            attributes: [['nombres', 'nombre'], ['apellidos', 'apellido']] 
                        },
                        {
                            model: ServicePrice,
                            as: 'PrecioServicio',
                            include: [
                                {
                                    model: sequelize.models.Service, // Si importaste Service arriba, puedes poner simplemente: model: Service
                                    as: 'Service', 
                                    attributes: ['descripcion', 'idTipoServicio']  
                                }
                            ]
                        },
                        {
                            model: Appointment,          // ← trae la fecha de la nueva cita
                            as: 'CitaNueva',
                            attributes: ['idCita', 'fecha'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        });

        const formattedAppointments = appointments.map(app => {
            const data = app.get({ plain: true });
            data.hora = data.hora.substring(0, 5);
            return data;
        });

        return res.status(200).send(formattedAppointments);
    } catch (error) {
        next(error);
    }
}

async function getAppointment(req, res, next) {
    try {
        const appointment = await Appointment.findByPk(req.params.id, { 
            include: [
                { model: Staff, as: 'Registrador', attributes: ['nombres', 'apellidos'] },
                { model: Staff, as: 'Veterinario', attributes: ['nombres', 'apellidos'] },
                { 
                    model: Pet, 
                    as: 'Mascota',
                    attributes: ['idMascota', 'nombre', 'idTamaño'],
                    include: [{ model: Client, as: 'Dueño', attributes: ['nombres', 'apellidos'] }] 
                },
                { model: AppointmentType, as: 'TipoCita' },
                { model: AppointmentState, as: 'EstadoCita' },
                { 
                    model: AppointmentDetail, 
                    as: 'detalles', 
                    include: [
                        { model: ServicePrice, as: 'PrecioServicio' },
                        { model: Staff, as: 'Ejecutor', attributes: ['idPersonal', 'nombres'] }
                    ] 
                }
                
            ] 
        });
        if (!appointment) return res.status(404).send({ msg: "Cita no encontrada." });
        // LIMPIEZA
        const data = appointment.get({ plain: true });
        data.hora = data.hora.substring(0, 5);

        return res.status(200).send(data);
    } catch (error) {
        next(error);
    }
}

async function getAppointmentsByStaff(req, res, next) {
    try {
        const idStaff = req.params.idStaff || req.user.idPersonal;
        const { date } = req.query;
        
        let whereClause = { idVeterinario: idStaff };
        if (date) whereClause.fecha = date; 
        // 1. Obtienes los datos de la base de datos
        const appointments = await Appointment.findAll({
            where: whereClause,
            order: [['hora', 'ASC']], 
            include: [
                {
                    model: Pet,
                    as: 'Mascota',
                    attributes: ['nombre', 'sexo'],
                    include: [
                        { model: Client, as: 'Dueño', attributes: ['nombres', 'apellidos', 'telefono'] },
                        { model: Breed, attributes: ['nombre'], include: [{ model: Species, attributes: ['nombre'] }] }
                    ]
                }
            ]
        });
        // 2. Transformas los datos (Limpias la hora)
        const formattedAppointments = appointments.map(app => {
            // .get({ plain: true }) convierte el objeto de Sequelize a un objeto simple JS
            const data = app.get({ plain: true }); 
            
            // Aquí limpias el formato
            data.hora = data.hora.substring(0, 5); 
            
            return data;
        });

        // 3. Envías la versión limpia al cliente
        return res.status(200).send(formattedAppointments);
    } catch (error) {
        next(error);
    }
}

async function updateAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const data = req.body;
        delete data.idRegistradoPor;

        const currentAppointment = await Appointment.findByPk(id);
        if (!currentAppointment) return res.status(404).send({ msg: "Cita no encontrada." });

        if (!isEditable(currentAppointment.idEstadoCita)) {
            return res.status(403).send({ msg: "No puedes editar una cita Finalizada o Cancelada." });
        }

        // --- LÓGICA DE CANCELACIÓN EN CASCADA ---
        if (parseInt(data.idEstadoCita) === 3) { // 3 = Cancelada
            await AppointmentDetail.update(
                { idEstadoServicio: 6 }, // 6 = Cancelado
                { where: { idCita: id }, transaction: t }
            );
        }

        const checkFecha = data.fecha || currentAppointment.fecha;
        const checkHora = data.hora || currentAppointment.hora;
        const checkIdVet = data.idVeterinario || currentAppointment.idVeterinario;
        const checkTipo = data.idTipoCita || currentAppointment.idTipoCita;

        const duracion = await calcularDuracion(null, checkTipo);
        const availability = await checkVetAvailability(checkFecha, checkHora, checkIdVet, checkTipo, duracion, id);
        
        if (!availability.isValid) { 
            await t.rollback(); 
            return res.status(400).send({ msg: availability.msg }); 
        }

        await Appointment.update(data, { where: { idCita: id }, transaction: t });
        
        await t.commit();
        return res.status(200).send({ msg: "Cita actualizada correctamente." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function cancelAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        
        // Buscamos la cita con sus detalles
        const cita = await Appointment.findByPk(id, {
            include: [{ model: AppointmentDetail, as: 'detalles' }]
        });

        if (!cita) {
            await t.rollback();
            return res.status(404).send({ msg: "Cita no encontrada." });
        }

        // REGLA DE SEGURIDAD: Si hay servicios Pagados (5), bloqueamos
        const tienePagos = cita.detalles?.some(d => d.idEstadoServicio === 5);
        if (tienePagos) {
            await t.rollback();
            return res.status(400).send({ msg: "No se puede anular una cita con servicios pagados." });
        }

        // 1. Cambiamos la cita a estado 3 (Cancelada)
        await cita.update({ idEstadoCita: 3 }, { transaction: t });

        // 2. Cambiamos todos sus detalles a estado 6 (Cancelado) 
        // Así no los borramos de la DB, pero quedan invalidados
        await sequelize.models.AppointmentDetail.update(
            { idEstadoServicio: 6 },
            { where: { idCita: id }, transaction: t }
        );

        await t.commit();
        return res.status(200).send({ msg: "Cita anulada correctamente." });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

async function updateStatus(req, res) {
    const { id } = req.params;
    const { idEstadoCita } = req.body;

    try {
        // Buscamos la cita por su ID
        const appointment = await Appointment.findByPk(id);

        if (!appointment) {
            return res.status(404).send({ msg: "No se encontró la cita seleccionada." });
        }

        // Actualizamos solo el campo del estado
        await appointment.update({ idEstadoCita });

        return res.status(200).send({ 
            msg: "Estado de la cita actualizado correctamente.",
            idEstadoCita 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ msg: "Error de servidor al actualizar el estado." });
    }
}

async function getAvailability(req, res, next) {
  try {
    const { date, staffId } = req.query;

    if (!date || !staffId) {
      return res.status(400).json({ msg: "Faltan datos obligatorios (fecha y staffId)" });
    }

    // 1. Configuración de la jornada laboral
    const inicioJornada = "09:00";
    const finJornada = "19:00";
    const intervaloMinutos = 30; // Tamaño de cada bloque de tiempo

    // 2. Buscar citas existentes que no estén canceladas (idEstadoCita != 3)
    const citasOcupadas = await Appointment.findAll({
      where: { 
        fecha: date, 
        idEstadoCita: { [Op.ne]: 3 } 
      },
      include: [{
        model: AppointmentDetail,
        as: "detalles", // <--- CORREGIDO: minúscula para que coincida con tu modelo
        required: true, 
        where: { idPersonalRealiza: staffId }
      }]
    });

    // 3. Extraer las horas de inicio ya ocupadas (formato "HH:mm")
    const horasOcupadas = citasOcupadas.map(c => {
      return c.hora.substring(0, 5);
    });

    // 4. Generar los slots de tiempo disponibles
    const slotsDisponibles = [];
    
    let current = new Date(`${date}T${inicioJornada}:00`);
    const end = new Date(`${date}T${finJornada}:00`);

    while (current < end) {
      const timeStr = current.toTimeString().substring(0, 5);

      if (!horasOcupadas.includes(timeStr)) {
        slotsDisponibles.push(timeStr);
      }

      current.setMinutes(current.getMinutes() + intervaloMinutos);
    }

    res.json(slotsDisponibles);

  } catch (error) {
    console.error("Error en getAvailability:", error);
    res.status(500).json({ 
      msg: "Error al calcular la disponibilidad de horarios",
      error: error.message 
    });
  }
}

async function confirmAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(id);

        if (!appointment) {
            return res.status(404).send({ msg: "Cita no encontrada." });
        }

        // Actualizamos al estado 2 (Confirmada)
        await appointment.update({ idEstadoCita: 2 });

        return res.status(200).send({ 
            msg: "Cita confirmada correctamente.",
            idEstadoCita: 2 
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { 
    createAppointment, 
    getAppointments, 
    getAppointment, 
    getAppointmentsByStaff, 
    updateAppointment, 
    cancelAppointment,
    updateStatus,
    getAvailability,
    confirmAppointment,
};