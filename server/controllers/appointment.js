const { Op } = require("sequelize");
const sequelize = require("../db");
const { isEditable } = require('../utils/appointmentHelpers');

const Appointment      = require("../models/appointment");
const AppointmentDetail = require("../models/appointmentDetail");
const ServicePrice     = require("../models/servicePrice");
const Service          = require("../models/service");
const Staff            = require("../models/staff");
const VetSchedule      = require("../models/vetSchedule");
const Schedule         = require("../models/schedule");
const Pet              = require("../models/pet");
const Client           = require("../models/client");
const Breed            = require("../models/breed");
const Species          = require("../models/species");
const AppointmentType  = require("../models/appointmentType");
const AppointmentState = require("../models/appointmentState");
const User             = require("../models/user");

// ─── Helpers de tiempo ───────────────────────────────────────────────────────

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const m = (totalMinutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function getDiaSemana(fechaStr) {
    const [y, mo, d] = fechaStr.split('-');
    const fecha = new Date(y, mo - 1, d);
    return ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'][fecha.getDay()];
}

// ─── Validación de rol vs tipo de servicio ───────────────────────────────────
// Tipos médico/quirúrgico/control: 1, 3, 4 → solo rol 2 (Veterinario)
// Tipo estética: 2 → roles 1-4 (todos menos cliente)
// Retorna { ok, msg }

async function validarEjecutorServicio(idPrecioServicio, ejecutorId) {
    const precio = await ServicePrice.findByPk(idPrecioServicio, {
        include: [{ model: Service, as: 'Service' }]
    });
    if (!precio) return { ok: false, msg: 'Precio de servicio inexistente.' };

    const tipoServicio = precio.Service?.idTipoServicio;

    const ejecutor = await Staff.findByPk(ejecutorId, {
        include: [{ model: User, as: 'User' }]
    });
    if (!ejecutor) return { ok: false, msg: `No existe personal con ID ${ejecutorId}.` };

    const rol = ejecutor.User?.idRol;

    // Médico / Quirúrgico / Control → solo veterinarios (rol 2)
    if ([1, 3, 4].includes(tipoServicio)) {
        if (rol !== 2) {
            return {
                ok: false,
                msg: `"${precio.Service.descripcion}" solo puede ser realizado por un Veterinario.`
            };
        }
    }

    // Estética → cualquier rol de personal (1-4), no clientes (5)
    if (tipoServicio === 2) {
        if (!rol || rol === 5) {
            return {
                ok: false,
                msg: `"${precio.Service.descripcion}" no puede ser realizado por un Cliente.`
            };
        }
    }

    return { ok: true };
}

// ─── Disponibilidad individual de un miembro del personal ────────────────────
// Valida horario laboral Y superposición contra otros servicios asignados a esa persona.
// idCitaActual: se ignora en edición para no chocarse con los propios detalles.

async function checkStaffAvailability(fecha, hora, idPersonal, duracionMinutos, idCitaActual = null) {
    const newStart = timeToMinutes(hora);
    const newEnd   = newStart + duracionMinutos;
    const dia      = getDiaSemana(fecha);

    // 1. Verificar horario laboral del personal
    const schedules = await VetSchedule.findAll({
        where: { idVeterinario: idPersonal },
        include: [{ model: Schedule }]
    });

    const atiendeHoy = schedules.some(s =>
        s.Schedule.diaSemana.toLowerCase() === dia.toLowerCase() &&
        newStart >= timeToMinutes(s.Schedule.horaInicio) &&
        newEnd   <= timeToMinutes(s.Schedule.horaFin)
    );

    if (!atiendeHoy) {
        return {
            isValid: false,
            msg: `El personal (ID ${idPersonal}) no tiene horario de atención el ${dia} en ese rango horario.`
        };
    }

    // 2. Detectar superposiciones: buscamos TODOS los servicios asignados a este personal ese día,
    //    sin importar si es el veterinario anfitrión o un ejecutor de servicio.
    const whereDetalle = { idPersonalRealiza: idPersonal };
    if (idCitaActual) {
        whereDetalle.idCita = { [Op.ne]: idCitaActual };
    }

    const serviciosAsignados = await AppointmentDetail.findAll({
        where: whereDetalle,
        include: [
            {
                model: Appointment,
                as: 'Cita',
                // Solo citas del mismo día que no estén canceladas
                where: { fecha, idEstadoCita: { [Op.ne]: 3 } }
            },
            {
                model: ServicePrice,
                as: 'PrecioServicio'
            }
        ]
    });

    for (const detalle of serviciosAsignados) {
        if (!detalle.Cita) continue;
        const s = timeToMinutes(detalle.Cita.hora);
        const durExistente = detalle.PrecioServicio?.duracionEstimada || 30;
        const e = s + durExistente;

        if (newStart < e && newEnd > s) {
            return {
                isValid: false,
                msg: `Conflicto de agenda (personal ID ${idPersonal}): ya tiene un servicio de ${detalle.Cita.hora.substring(0,5)} a ${minutesToTime(e)}.`
            };
        }
    }

    return { isValid: true };
}

// ─── Duración total que ocupa el veterinario anfitrión ───────────────────────
// Solo suma los servicios que él mismo ejecuta.

async function calcularDuracionPersonal(servicios, idPersonal) {
    let total = 0;
    for (const s of servicios) {
        const ejecutor = s.idPersonalRealiza || idPersonal;
        if (Number(ejecutor) !== Number(idPersonal)) continue;

        const precio = await ServicePrice.findByPk(s.idPrecioServicio);
        total += precio?.duracionEstimada || 30;
    }
    return total || 30;
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

async function createAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { fecha, hora, idMascota, idTipoCita, idEstadoCita, idVeterinario, servicios } = req.body;

        // PASO 1 — Validar que el veterinario anfitrión existe Y tiene rol 2
        const vetAnfitrion = await Staff.findByPk(idVeterinario, {
            include: [{ model: User, as: 'User' }]
        });

        if (!vetAnfitrion) {
            await t.rollback();
            return res.status(404).send({ msg: `No existe personal con ID ${idVeterinario}.` });
        }
        if (vetAnfitrion.User?.idRol !== 2) {
            await t.rollback();
            return res.status(400).send({ msg: 'El veterinario anfitrión debe tener rol de Veterinario.' });
        }

        // PASO 2 — Validar disponibilidad del veterinario anfitrión
        // (solo para los servicios que él mismo ejecuta)
        if (servicios && servicios.length > 0) {
            const durVet = await calcularDuracionPersonal(servicios, idVeterinario);
            const dispVet = await checkStaffAvailability(fecha, hora, idVeterinario, durVet);
            if (!dispVet.isValid) {
                await t.rollback();
                return res.status(400).send({ msg: `Veterinario anfitrión: ${dispVet.msg}` });
            }
        }

        // PASO 3 — Validar cada servicio individualmente
        if (servicios && servicios.length > 0) {
            // Rastreamos ejecutores ya validados para no duplicar checkStaffAvailability
            const ejecutoresYaValidados = new Set();

            for (const s of servicios) {
                const ejecutorId = s.idPersonalRealiza ? Number(s.idPersonalRealiza) : Number(idVeterinario);

                // 3a. Validar reglas de rol (médico → solo vet, estética → no cliente)
                const validRol = await validarEjecutorServicio(s.idPrecioServicio, ejecutorId);
                if (!validRol.ok) {
                    await t.rollback();
                    return res.status(400).send({ msg: validRol.msg });
                }

                // 3b. Validar disponibilidad horaria del ejecutor (una vez por persona)
                //     El veterinario anfitrión ya fue validado en el Paso 2, lo saltamos
                //     solo si tiene servicios propios (ya chequeado). Si es otro ejecutor, validamos.
                if (!ejecutoresYaValidados.has(ejecutorId)) {
                    ejecutoresYaValidados.add(ejecutorId);

                    // Calcular duración total de todos los servicios que ejecuta este personal
                    const durPersonal = await calcularDuracionPersonal(servicios, ejecutorId);
                    const disp = await checkStaffAvailability(fecha, hora, ejecutorId, durPersonal);
                    if (!disp.isValid) {
                        await t.rollback();
                        return res.status(400).send({ msg: disp.msg });
                    }
                }
            }
        }

        // PASO 4 — Crear cabecera de la cita
        const appointment = await Appointment.create({
            fecha, hora, idMascota, idTipoCita, idVeterinario,
            idEstadoCita: idEstadoCita || 1,
            idRegistradoPor: req.user.idPersonal,
        }, { transaction: t });

        // PASO 5 — Crear detalles de servicios
        if (servicios && servicios.length > 0) {
            const detalles = servicios.map(s => ({
                idCita:            appointment.idCita,
                idPrecioServicio:  s.idPrecioServicio,
                idPersonalRealiza: s.idPersonalRealiza ? Number(s.idPersonalRealiza) : Number(idVeterinario),
                idEstadoServicio:  s.idEstadoServicio || 1,
                observaciones:     s.observaciones || null,
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

// ─── GET ALL ─────────────────────────────────────────────────────────────────

async function getAppointments(req, res, next) {
    try {
        const { date } = req.query;
        const { idRol, user_id } = req.user;
        let whereClause = {};

        if (date) whereClause.fecha = date;

        if (idRol === 5) {
            const client = await Client.findOne({ where: { idUsuario: user_id } });
            if (!client) return res.status(200).send([]);
            const myPets = await Pet.findAll({ where: { idCliente: client.idCliente } });
            whereClause.idMascota = { [Op.in]: myPets.map(p => p.idMascota) };
        }

        const appointments = await Appointment.findAll({
            where: whereClause,
            include: [
                { model: Staff, as: 'Registrador', attributes: ['nombres', 'apellidos'] },
                { model: Staff, as: 'Veterinario', attributes: ['nombres', 'apellidos'] },
                {
                    model: Pet,
                    as: 'Mascota',
                    attributes: ['idMascota', 'nombre', 'idTamaño', 'idRaza'],
                    include: [
                        { model: Client, as: 'Dueño', attributes: ['nombres', 'apellidos'] },
                        { model: Breed,  as: 'Raza',  attributes: ['idRaza', 'nombre', 'idEspecie'] }
                    ]
                },
                { model: AppointmentType,  as: 'TipoCita'   },
                { model: AppointmentState, as: 'EstadoCita'  },
                {
                    model: AppointmentDetail,
                    as: 'detalles',
                    include: [
                        {
                            model: Staff,
                            as: 'Ejecutor',
                            attributes: [['nombres', 'nombre'], ['apellidos', 'apellido']]
                        },
                        {
                            model: ServicePrice,
                            as: 'PrecioServicio',
                            include: [{ model: Service, as: 'Service', attributes: ['descripcion', 'idTipoServicio'] }]
                        },
                        {
                            model: Appointment,
                            as: 'CitaNueva',
                            attributes: ['idCita', 'fecha'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['fecha', 'ASC'], ['hora', 'ASC']]
        });

        return res.status(200).send(
            appointments.map(app => {
                const data = app.get({ plain: true });
                data.hora = data.hora.substring(0, 5);
                return data;
            })
        );
    } catch (error) {
        next(error);
    }
}

// ─── GET ONE ─────────────────────────────────────────────────────────────────

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
                { model: AppointmentType,  as: 'TipoCita'  },
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
        if (!appointment) return res.status(404).send({ msg: 'Cita no encontrada.' });
        const data = appointment.get({ plain: true });
        data.hora = data.hora.substring(0, 5);
        return res.status(200).send(data);
    } catch (error) {
        next(error);
    }
}

// ─── GET BY STAFF ─────────────────────────────────────────────────────────────

async function getAppointmentsByStaff(req, res, next) {
    try {
        const idStaff = req.params.idStaff || req.user.idPersonal;
        const { date } = req.query;
        let whereClause = { idVeterinario: idStaff };
        if (date) whereClause.fecha = date;

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

        return res.status(200).send(
            appointments.map(app => {
                const data = app.get({ plain: true });
                data.hora = data.hora.substring(0, 5);
                return data;
            })
        );
    } catch (error) {
        next(error);
    }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// Solo actualiza la cabecera (fecha, hora, vet, estado).
// Los servicios individuales se actualizan desde el endpoint de appointmentDetail.

async function updateAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const data = req.body;
        delete data.idRegistradoPor; // nunca se modifica

        const currentAppointment = await Appointment.findByPk(id, {
            include: [{ model: AppointmentDetail, as: 'detalles' }]
        });
        if (!currentAppointment) return res.status(404).send({ msg: 'Cita no encontrada.' });

        if (!isEditable(currentAppointment.idEstadoCita)) {
            await t.rollback();
            return res.status(403).send({ msg: 'No podés editar una cita Finalizada o Cancelada.' });
        }

        // Cancelación en cascada
        if (parseInt(data.idEstadoCita) === 3) {
            await AppointmentDetail.update(
                { idEstadoServicio: 6 },
                { where: { idCita: id }, transaction: t }
            );
        }

        // Si cambia fecha/hora/vet, revalidamos disponibilidad del anfitrión
        const fechaCheck = data.fecha || currentAppointment.fecha;
        const horaCheck  = data.hora  || currentAppointment.hora;
        const vetCheck   = data.idVeterinario || currentAppointment.idVeterinario;

        // Calculamos la duración sumando los servicios que ejecuta el vet anfitrión
        const detallesActuales = currentAppointment.detalles || [];
        let durVet = 0;
        for (const det of detallesActuales) {
            if (Number(det.idPersonalRealiza) !== Number(vetCheck)) continue;
            const precio = await ServicePrice.findByPk(det.idPrecioServicio);
            durVet += precio?.duracionEstimada || 30;
        }
        if (durVet === 0) durVet = 30;

        const disp = await checkStaffAvailability(fechaCheck, horaCheck, vetCheck, durVet, id);
        if (!disp.isValid) {
            await t.rollback();
            return res.status(400).send({ msg: disp.msg });
        }

        await Appointment.update(data, { where: { idCita: id }, transaction: t });
        await t.commit();
        return res.status(200).send({ msg: 'Cita actualizada correctamente.' });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

// ─── CANCEL ───────────────────────────────────────────────────────────────────

async function cancelAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const cita = await Appointment.findByPk(id, {
            include: [{ model: AppointmentDetail, as: 'detalles' }]
        });

        if (!cita) {
            await t.rollback();
            return res.status(404).send({ msg: 'Cita no encontrada.' });
        }

        const tienePagos = cita.detalles?.some(d => d.idEstadoServicio === 5);
        if (tienePagos) {
            await t.rollback();
            return res.status(400).send({ msg: 'No se puede anular una cita con servicios pagados.' });
        }

        await cita.update({ idEstadoCita: 3 }, { transaction: t });
        await AppointmentDetail.update(
            { idEstadoServicio: 6 },
            { where: { idCita: id }, transaction: t }
        );

        await t.commit();
        return res.status(200).send({ msg: 'Cita anulada correctamente.' });
    } catch (error) {
        if (t) await t.rollback();
        next(error);
    }
}

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────

async function updateStatus(req, res) {
    const { id } = req.params;
    const { idEstadoCita } = req.body;
    try {
        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).send({ msg: 'No se encontró la cita seleccionada.' });
        await appointment.update({ idEstadoCita });
        return res.status(200).send({ msg: 'Estado de la cita actualizado correctamente.', idEstadoCita });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ msg: 'Error de servidor al actualizar el estado.' });
    }
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

async function getAvailability(req, res, next) {
    try {
        const { date, staffId } = req.query;
        if (!date || !staffId) {
            return res.status(400).json({ msg: 'Faltan datos obligatorios (fecha y staffId).' });
        }

        const inicioJornada   = '09:00';
        const finJornada      = '19:00';
        const intervaloMinutos = 30;

        const citasOcupadas = await Appointment.findAll({
            where: { fecha: date, idEstadoCita: { [Op.ne]: 3 } },
            include: [{
                model: AppointmentDetail,
                as: 'detalles',
                required: true,
                where: { idPersonalRealiza: staffId }
            }]
        });

        const horasOcupadas = citasOcupadas.map(c => c.hora.substring(0, 5));

        const slotsDisponibles = [];
        let current = new Date(`${date}T${inicioJornada}:00`);
        const end   = new Date(`${date}T${finJornada}:00`);

        while (current < end) {
            const timeStr = current.toTimeString().substring(0, 5);
            if (!horasOcupadas.includes(timeStr)) slotsDisponibles.push(timeStr);
            current.setMinutes(current.getMinutes() + intervaloMinutos);
        }

        return res.json(slotsDisponibles);
    } catch (error) {
        console.error('Error en getAvailability:', error);
        return res.status(500).json({ msg: 'Error al calcular la disponibilidad.', error: error.message });
    }
}

// ─── CONFIRM ─────────────────────────────────────────────────────────────────

async function confirmAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findByPk(id);
        if (!appointment) return res.status(404).send({ msg: 'Cita no encontrada.' });
        await appointment.update({ idEstadoCita: 2 });
        return res.status(200).send({ msg: 'Cita confirmada correctamente.', idEstadoCita: 2 });
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