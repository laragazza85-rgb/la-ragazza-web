import { db } from "../db/connection.mjs";

const bookingColumns = `
  b.id,
  b.user_id,
  b.nombre_cliente,
  b.fecha,
  b.hora,
  b.numero_personas,
  b.comentarios,
  b.status_id,
  s.name AS status_name,
  b.created_at,
  b.updated_at
`;

export const bookingRepository = {
  create({ userId, nombreCliente, fecha, hora, numeroPersonas, comentarios, statusId }) {
    const result = db
      .prepare(
        `INSERT INTO bookings (
          user_id, nombre_cliente, fecha, hora, numero_personas, comentarios, status_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userId, nombreCliente, fecha, hora, numeroPersonas, comentarios, statusId);

    return this.findById(result.lastInsertRowid);
  },

  listByUserId(userId) {
    return db
      .prepare(
        `SELECT ${bookingColumns}
         FROM bookings b
         JOIN booking_status s ON s.id = b.status_id
         WHERE b.user_id = ?
         ORDER BY b.fecha ASC, b.hora ASC`
      )
      .all(userId);
  },

  listAll() {
    return db
      .prepare(
        `SELECT ${bookingColumns}
         FROM bookings b
         JOIN booking_status s ON s.id = b.status_id
         ORDER BY b.fecha ASC, b.hora ASC`
      )
      .all();
  },

  findById(id) {
    return db
      .prepare(
        `SELECT ${bookingColumns}
         FROM bookings b
         JOIN booking_status s ON s.id = b.status_id
         WHERE b.id = ?`
      )
      .get(id);
  },

  update(id, { nombreCliente, fecha, hora, numeroPersonas, comentarios, statusId }) {
    db.prepare(
      `UPDATE bookings
       SET nombre_cliente = ?,
           fecha = ?,
           hora = ?,
           numero_personas = ?,
           comentarios = ?,
           status_id = ?
       WHERE id = ?`
    ).run(nombreCliente, fecha, hora, numeroPersonas, comentarios, statusId, id);

    return this.findById(id);
  },

  updateStatus(id, statusId) {
    db.prepare("UPDATE bookings SET status_id = ? WHERE id = ?").run(statusId, id);
    return this.findById(id);
  },

  remove(id) {
    return db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
  }
};
