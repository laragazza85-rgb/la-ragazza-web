const BOOKING_SELECT = `
  id,
  user_id,
  client_name,
  booking_time,
  party_size,
  comments,
  status,
  created_at,
  updated_at
`;

function mapBooking(row) {
  if (!row) return null;

  const bookingTime = String(row.booking_time ?? "");
  return {
    ...row,
    nombre_cliente: row.client_name,
    fecha: bookingTime ? bookingTime.slice(0, 10) : "",
    hora: bookingTime ? bookingTime.slice(11, 16) : "",
    numero_personas: row.party_size,
    comentarios: row.comments ?? "",
    status_name: row.status
  };
}

async function runQuery(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const bookingRepository = {
  async create(supabase, { userId, nombreCliente, bookingTime, numeroPersonas, comentarios, status }) {
    const data = await runQuery(
      supabase
        .from("bookings")
        .insert({
          user_id: userId,
          client_name: nombreCliente,
          booking_time: bookingTime,
          party_size: numeroPersonas,
          comments: comentarios,
          status
        })
        .select(BOOKING_SELECT)
        .single()
    );

    return mapBooking(data);
  },

  async listByUserId(supabase, userId) {
    const data = await runQuery(
      supabase.from("bookings").select(BOOKING_SELECT).eq("user_id", userId).order("booking_time", {
        ascending: true
      })
    );

    return data.map(mapBooking);
  },

  async listAll(supabase) {
    const data = await runQuery(
      supabase.from("bookings").select(BOOKING_SELECT).order("booking_time", {
        ascending: true
      })
    );

    return data.map(mapBooking);
  },

  async findById(supabase, id) {
    const data = await runQuery(supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).maybeSingle());
    return mapBooking(data);
  },

  async update(supabase, id, payload) {
    const data = await runQuery(
      supabase
        .from("bookings")
        .update(payload)
        .eq("id", id)
        .select(BOOKING_SELECT)
        .single()
    );

    return mapBooking(data);
  },

  async updateStatus(supabase, id, status) {
    return this.update(supabase, id, { status });
  },

  async remove(supabase, id) {
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) throw error;
  }
};
