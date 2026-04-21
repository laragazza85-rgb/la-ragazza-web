import { bookingRepository } from "../repositories/bookingRepository.mjs";
import { statusRepository } from "../repositories/statusRepository.mjs";
import { HttpError } from "../utils/httpError.mjs";

function normalizeBookingPayload(input) {
  return {
    nombreCliente: String(input.nombre_cliente ?? "").trim(),
    fecha: String(input.fecha ?? "").trim(),
    hora: String(input.hora ?? "").trim(),
    numeroPersonas: Number(input.numero_personas),
    comentarios: String(input.comentarios ?? "").trim()
  };
}

function validateBooking(payload) {
  if (!payload.nombreCliente || !payload.fecha || !payload.hora) {
    throw new HttpError(400, "nombre_cliente, fecha y hora son obligatorios.");
  }

  if (!Number.isInteger(payload.numeroPersonas) || payload.numeroPersonas <= 0) {
    throw new HttpError(400, "numero_personas debe ser un entero mayor a 0.");
  }

  if (payload.comentarios.length > 800) {
    throw new HttpError(400, "comentarios no debe superar 800 caracteres.");
  }
}

function ensureCanAccessBooking(booking, user) {
  if (!booking) throw new HttpError(404, "Reserva no encontrada.");
  if (user.role !== "admin" && booking.user_id !== user.id) {
    throw new HttpError(403, "No tienes permisos para esta reserva.");
  }
}

export const bookingService = {
  listBookings(user) {
    return user.role === "admin"
      ? bookingRepository.listAll()
      : bookingRepository.listByUserId(user.id);
  },

  getBookingById(id, user) {
    const booking = bookingRepository.findById(id);
    ensureCanAccessBooking(booking, user);
    return booking;
  },

  createBooking(body, user) {
    const payload = normalizeBookingPayload(body);
    validateBooking(payload);

    const pending = statusRepository.findByName("pending");
    return bookingRepository.create({
      userId: user.id,
      ...payload,
      statusId: pending.id
    });
  },

  updateBooking(id, body, user) {
    const current = bookingRepository.findById(id);
    ensureCanAccessBooking(current, user);

    const payload = normalizeBookingPayload(body);
    validateBooking(payload);

    let statusId = current.status_id;
    if (user.role === "admin" && body.status) {
      const status = statusRepository.findByName(String(body.status));
      if (!status) throw new HttpError(400, "Estado inválido.");
      statusId = status.id;
    }

    return bookingRepository.update(id, {
      ...payload,
      statusId
    });
  },

  updateBookingStatus(id, statusName, user) {
    if (user.role !== "admin") {
      throw new HttpError(403, "Solo administradores pueden cambiar estado.");
    }

    const booking = bookingRepository.findById(id);
    if (!booking) throw new HttpError(404, "Reserva no encontrada.");

    const status = statusRepository.findByName(String(statusName));
    if (!status) throw new HttpError(400, "Estado inválido.");

    return bookingRepository.updateStatus(id, status.id);
  },

  deleteBooking(id, user) {
    const booking = bookingRepository.findById(id);
    ensureCanAccessBooking(booking, user);

    bookingRepository.remove(id);
  }
};
