const { Op } = require("sequelize");
const sequelize = require("../db");
const { isEditable } = require('../utils/appointmentHelpers');

const Appointment       = require("../models/appointment");
const AppointmentDetail = require("../models/appointmentDetail");
const ServicePrice      = require("../models/servicePrice");
const Service           = require("../models/service");
const Staff             = require("../models/staff");
const VetSchedule       = require("../models/vetSchedule");
const Schedule          = require("../models/schedule");
const Pet               = require("../models/pet");
const Client            = require("../models/client");
const Breed             = require("../models/breed");
const Species           = require("../models/species");
const AppointmentType   = require("../models/appointmentType");
const AppointmentState  = require("../models/appointmentState");
const User              = require("../models/user");

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
//
//  idTipoServicio:
//    1 = Médico      → solo Veterinario (rol 2)
//    2 = Estética    → cualquier staff (rol 1-4), NO clientes (rol 5)
//    3 = Quirúrgico  → solo Veterinario (rol 2)
//    4 = Control     → solo Veterinario (rol 2)
//
// Retorna { ok: bool, msg: string }

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

    // Médico / Quirúrgico / Control → SOLO veterinarios (rol 2)
    if ([1, 3, 4].includes(tipoServicio)) {
        if (rol !== 2) {
            return {
                ok: false,
                msg: `El servicio "${precio.Service.descripcion}" es de tipo médico/quirúrgico/control y solo puede ser realizado por un Veterinario.`
            };
        }
    }

    // Estética → cualquier rol de staff (1-4), no clientes (5)
    if (tipoServicio === 2) {
        if (!rol || rol === 5) {
            return {
                ok: false,
                msg: `El servicio "${precio.Service.descripcion}" no puede ser realizado por un Cliente.`
            };
        }
    }

    return { ok: true };
}

// ─── Verificar horario laboral del personal ───────────────────────────────────
//
// REGLA:
//   - Veterinarios (rol 2): tienen su propio horario en HORARIO_VETERINARIO.
//     Si no tienen ninguno cargado, se usa el horario general (Schedule).
//   - Resto del staff (Admin, Asistente, Vendedor): se valida contra el
//     horario general de la clínica (Schedule). No tienen tabla propia.
//
// Retorna { ok: bool, msg: string }

async function verificarHorarioLaboral(fecha, hora, duracionMinutos, idPersonal) {
    const newStart = timeToMinutes(hora);
    const newEnd   = newStart + duracionMinutos;
    const dia      = getDiaSemana(fecha);

    // Intentar horario propio de veterinario
    const vetSchedules = await VetSchedule.findAll({
        where: { idVeterinario: idPersonal },
        include: [{ model: Schedule }]
    });

    if (vetSchedules.length > 0) {
        // Tiene horario propio → usarlo
        const atiendeHoy = vetSchedules.some(s =>
            s.Schedule.diaSemana.toLowerCase() === dia.toLowerCase() &&
            newStart >= timeToMinutes(s.Schedule.horaInicio) &&
            newEnd   <= timeToMinutes(s.Schedule.horaFin)
        );
        if (!atiendeHoy) {
            return {
                ok: false,
                msg: `El personal (ID ${idPersonal}) no tiene horario de atención el ${dia} en el rango ${hora}–${minutesToTime(newEnd)}.`
            };
        }
    } else {
        // Sin horario propio → usar horario general de la clínica
        const horariosClinica = await Schedule.findAll({
            where: { diaSemana: dia }
        });
        const atiendeHoy = horariosClinica.some(h =>
            newStart >= timeToMinutes(h.horaInicio) &&
            newEnd   <= timeToMinutes(h.horaFin)
        );
        if (!atiendeHoy) {
            return {
                ok: false,
                msg: `La clínica no atiende el ${dia} en el rango ${hora}–${minutesToTime(newEnd)}.`
            };
        }
    }

    return { ok: true };
}

// ─── Verificar superposición de agenda del personal ──────────────────────────
//
// Busca todos los servicios ya asignados a este personal en esa fecha
// y detecta si alguno se superpone con el nuevo rango [hora, hora + duracion).
//
// Cada servicio tiene su propia duración (no la de la cita completa).
// idCitaActual: en edición, excluye los detalles de esa misma cita para
//               no chocarse consigo mismo.
//
// Retorna { ok: bool, msg: string }

async function verificarSuperposicion(fecha, hora, duracionMinutos, idPersonal, idCitaActual = null) {
    const newStart = timeToMinutes(hora);
    const newEnd   = newStart + duracionMinutos;

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
                where: { fecha, idEstadoCita: { [Op.ne]: 3 } }   // misma fecha, no canceladas
            },
            {
                model: ServicePrice,
                as: 'PrecioServicio'
            }
        ]
    });

    for (const detalle of serviciosAsignados) {
        if (!detalle.Cita) continue;

        // El bloque ocupado es: desde la hora de la cita hasta hora + duración del servicio puntual
        const existStart = timeToMinutes(detalle.Cita.hora);
        const durExistente = detalle.PrecioServicio?.duracionEstimada || 30;
        const existEnd   = existStart + durExistente;

        // Superposición: los rangos se solapan si newStart < existEnd && newEnd > existStart
        if (newStart < existEnd && newEnd > existStart) {
            return {
                ok: false,
                msg: `Conflicto de agenda: el personal (ID ${idPersonal}) ya tiene un servicio de ${detalle.Cita.hora.substring(0,5)} a ${minutesToTime(existEnd)}.`
            };
        }
    }

    return { ok: true };
}

// ─── Validación completa de disponibilidad de un miembro del staff ────────────
//
// Combina verificarHorarioLaboral + verificarSuperposicion.
// duracionMinutos = duración total de los servicios que ESTE PERSONAL ejecuta
//                  en la nueva cita (no la duración de toda la cita).

async function checkStaffAvailability(fecha, hora, idPersonal, duracionMinutos, idCitaActual = null) {
    const horario = await verificarHorarioLaboral(fecha, hora, duracionMinutos, idPersonal);
    if (!horario.ok) return { isValid: false, msg: horario.msg };

    const superposicion = await verificarSuperposicion(fecha, hora, duracionMinutos, idPersonal, idCitaActual);
    if (!superposicion.ok) return { isValid: false, msg: superposicion.msg };

    return { isValid: true };
}

// ─── Duración total de los servicios que ejecuta UN personal en una lista ─────
//
// Suma solo las duraciones de los servicios donde idPersonalRealiza === idPersonal.
// Si el campo viene vacío, se asume que lo hace el veterinario anfitrión (idVetDefault).

async function calcularDuracionPersonal(servicios, idPersonal, idVetDefault = null) {
    let total = 0;
    for (const s of servicios) {
        const ejecutorId = s.idPersonalRealiza ? Number(s.idPersonalRealiza) : Number(idVetDefault);
        if (Number(ejecutorId) !== Number(idPersonal)) continue;

        const precio = await ServicePrice.findByPk(s.idPrecioServicio);
        total += precio?.duracionEstimada || 30;
    }
    return total || 30;   // mínimo 30 min para no bloquear con 0
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

async function createAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { fecha, hora, idMascota, idTipoCita, idEstadoCita, idVeterinario, servicios } = req.body;

        // PASO 1 — Veterinario anfitrión: debe existir y tener rol 2
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

        // PASO 2 & 3 — Validar servicios y disponibilidad de cada ejecutor
        if (servicios && servicios.length > 0) {

            // Mapa: idPersonal → duración total de sus servicios en esta cita
            const duracionPorPersonal = {};

            for (const s of servicios) {
                const ejecutorId = s.idPersonalRealiza ? Number(s.idPersonalRealiza) : Number(idVeterinario);

                // 2a. Validar regla de rol (médico/quirúrgico/control → solo vet; estética → no cliente)
                const validRol = await validarEjecutorServicio(s.idPrecioServicio, ejecutorId);
                if (!validRol.ok) {
                    await t.rollback();
                    return res.status(400).send({ msg: validRol.msg });
                }

                // Acumular duración por persona
                const precio = await ServicePrice.findByPk(s.idPrecioServicio);
                const durServicio = precio?.duracionEstimada || 30;
                duracionPorPersonal[ejecutorId] = (duracionPorPersonal[ejecutorId] || 0) + durServicio;
            }

            // 2b. Validar disponibilidad horaria de cada ejecutor involucrado
            for (const [idPersonal, duracion] of Object.entries(duracionPorPersonal)) {
                const disp = await checkStaffAvailability(fecha, hora, Number(idPersonal), duracion);
                if (!disp.isValid) {
                    await t.rollback();
                    return res.status(400).send({ msg: disp.msg });
                }
            }
        }

        // PASO 4 — Crear cabecera
        const appointment = await Appointment.create({
            fecha, hora, idMascota, idTipoCita, idVeterinario,
            idEstadoCita: idEstadoCita || 1,
            idRegistradoPor: req.user.idPersonal,
        }, { transaction: t });

        // PASO 5 — Crear detalles
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

async function updateAppointment(req, res, next) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const data = req.body;
        delete data.idRegistradoPor;

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

        const fechaCheck = data.fecha || currentAppointment.fecha;
        const horaCheck  = data.hora  || currentAppointment.hora;
        const vetCheck   = data.idVeterinario || currentAppointment.idVeterinario;

        // Revalidar disponibilidad del veterinario anfitrión
        // usando solo la duración de los servicios que él mismo ejecuta
        const detallesActuales = currentAppointment.detalles || [];
        const duracionPorPersonal = {};

        for (const det of detallesActuales) {
            const precio = await ServicePrice.findByPk(det.idPrecioServicio);
            const dur = precio?.duracionEstimada || 30;
            const pid = Number(det.idPersonalRealiza);
            duracionPorPersonal[pid] = (duracionPorPersonal[pid] || 0) + dur;
        }

        // Si el vet anfitrión no ejecuta ningún servicio, usar 30 min como mínimo
        if (!duracionPorPersonal[Number(vetCheck)]) {
            duracionPorPersonal[Number(vetCheck)] = 30;
        }

        // Solo revalidamos el vet anfitrión en el update de cabecera.
        // Los ejecutores de servicios individuales se revalidan desde appointmentDetail.
        const disp = await checkStaffAvailability(fechaCheck, horaCheck, vetCheck, duracionPorPersonal[Number(vetCheck)], id);
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
//
// Devuelve los slots libres del día para un staff.
// Un slot está "ocupado" si el personal tiene algún AppointmentDetail cuya
// cita empieza en ese slot (simplificación de 30 min por slot).
// Para una precisión real de rangos, el frontend debería consultar checkStaffAvailability.

async function getAvailability(req, res, next) {
    try {
        const { date, staffId } = req.query;
        if (!date || !staffId) {
            return res.status(400).json({ msg: 'Faltan datos obligatorios (fecha y staffId).' });
        }

        const inicioJornada    = '09:00';
        const finJornada       = '19:00';
        const intervaloMinutos = 30;

        // Traer todos los detalles de ese staff ese día (con la duración de cada servicio)
        const detalles = await AppointmentDetail.findAll({
            where: { idPersonalRealiza: staffId },
            include: [
                {
                    model: Appointment,
                    as: 'Cita',
                    where: { fecha: date, idEstadoCita: { [Op.ne]: 3 } }
                },
                {
                    model: ServicePrice,
                    as: 'PrecioServicio'
                }
            ]
        });

        // Construir lista de bloques ocupados: [{ start, end }]
        const bloquesOcupados = detalles
            .filter(d => d.Cita)
            .map(d => {
                const start = timeToMinutes(d.Cita.hora);
                const dur   = d.PrecioServicio?.duracionEstimada || 30;
                return { start, end: start + dur };
            });

        // Generar slots y filtrar los que no se solapan con ningún bloque
        const slotsDisponibles = [];
        let current = new Date(`${date}T${inicioJornada}:00`);
        const end   = new Date(`${date}T${finJornada}:00`);

        while (current < end) {
            const timeStr  = current.toTimeString().substring(0, 5);
            const slotMin  = timeToMinutes(timeStr);
            const slotFin  = slotMin + intervaloMinutos;

            const ocupado = bloquesOcupados.some(b => slotMin < b.end && slotFin > b.start);
            if (!ocupado) slotsDisponibles.push(timeStr);

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