import { HttpError } from "../utils/httpError.mjs";
import { assertNoHtmlMarkup } from "../utils/xss.mjs";
import { bookingRepository } from "../repositories/bookingRepository.mjs";

const BOOKING_STATUS = new Set(["pending", "confirmed", "cancelled", "completed", "no_show"]);

function normalizeBookingPayload(input) {
  const fecha = String(input.fecha ?? "").trim();
  const hora = String(input.hora ?? "").trim();

  return {
    nombreCliente: String(input.nombre_cliente ?? "").trim(),
    fecha,
    hora,
    bookingTime: fecha && hora ? `${fecha}T${hora}:00.000Z` : "",
    numeroPersonas: Number(input.numero_personas),
    comentarios: String(input.comentarios ?? "").trim()
  };
}

function validateBooking(payload) {
  if (!payload.nombreCliente || !payload.fecha || !payload.hora) {
    throw new HttpError(400, "nombre_cliente, fecha y hora son obligatorios.");
  }

  assertNoHtmlMarkup({
    nombre_cliente: payload.nombreCliente,
    comentarios: payload.comentarios
  });

  if (payload.nombreCliente.length > 120) {
    throw new HttpError(400, "nombre_cliente no debe superar 120 caracteres.");
  }

  if (!Number.isInteger(payload.numeroPersonas) || payload.numeroPersonas <= 0) {
    throw new HttpError(400, "numero_personas debe ser un entero mayor a 0.");
  }

  if (payload.comentarios.length > 800) {
    throw new HttpError(400, "comentarios no debe superar 800 caracteres.");
  }

  if (Number.isNaN(Date.parse(payload.bookingTime))) {
    throw new HttpError(400, "fecha y hora tienen un formato invalido.");
  }

  if (new Date(payload.bookingTime).getTime() <= Date.now() - 15 * 60 * 1000) {
    throw new HttpError(400, "La reserva no puede crearse en el pasado.");
  }
}

function ensureCanAccessBooking(booking, user) {
  if (!booking) throw new HttpError(404, "Reserva no encontrada.");
  if (user.role !== "admin" && user.role !== "staff" && booking.user_id !== user.id) {
    throw new HttpError(403, "No tienes permisos para esta reserva.");
  }
}

export const bookingService = {
  async listBookings(auth) {
    return auth.user.role === "admin" || auth.user.role === "staff"
      ? bookingRepository.listAll(auth.supabase)
      : bookingRepository.listByUserId(auth.supabase, auth.user.id);
  },

  async getBookingById(id, auth) {
    const booking = await bookingRepository.findById(auth.supabase, id);
    ensureCanAccessBooking(booking, auth.user);
    return booking;
  },

  async createBooking(body, auth) {
    const payload = normalizeBookingPayload(body);
    validateBooking(payload);

    return bookingRepository.create(auth.supabase, {
      userId: auth.user.id,
      ...payload,
      status: "pending"
    });
  },

  async updateBooking(id, body, auth) {
    const current = await bookingRepository.findById(auth.supabase, id);
    ensureCanAccessBooking(current, auth.user);

    const payload = normalizeBookingPayload(body);
    validateBooking(payload);

    if (auth.user.role === "customer" && current.status_name !== "pending") {
      throw new HttpError(409, "Solo puedes modificar reservas pendientes.");
    }

    const updatePayload = {
      client_name: payload.nombreCliente,
      booking_time: payload.bookingTime,
      party_size: payload.numeroPersonas,
      comments: payload.comentarios
    };

    if ((auth.user.role === "admin" || auth.user.role === "staff") && body.status) {
      const status = String(body.status).trim().toLowerCase();
      if (!BOOKING_STATUS.has(status)) throw new HttpError(400, "Estado inválido.");
      updatePayload.status = status;
    }

    return bookingRepository.update(auth.supabase, id, updatePayload);
  },

  async updateBookingStatus(id, statusName, auth) {
    if (auth.user.role !== "admin" && auth.user.role !== "staff") {
      throw new HttpError(403, "Solo administradores o staff pueden cambiar estado.");
    }

    const booking = await bookingRepository.findById(auth.supabase, id);
    if (!booking) throw new HttpError(404, "Reserva no encontrada.");

    const status = String(statusName).trim().toLowerCase();
    if (!BOOKING_STATUS.has(status)) {
      throw new HttpError(400, "Estado inválido.");
    }

    return bookingRepository.updateStatus(auth.supabase, id, status);
  },

  async deleteBooking(id, auth) {
    const booking = await bookingRepository.findById(auth.supabase, id);
    ensureCanAccessBooking(booking, auth.user);

    await bookingRepository.remove(auth.supabase, id);
  }
};
