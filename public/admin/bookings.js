import { escapeHtml } from "/admin/common.js";
import { initEntityCrudPage } from "/admin/entityCrudPage.js";

const BOOKING_STATUS = ["pending", "confirmed", "cancelled", "completed", "no_show"];

function toNumber(value) {
  return Number(value ?? 0);
}

initEntityCrudPage({
  selectors: {
    rows: "#booking-rows",
    status: "#booking-status",
    contextLabel: "#bookings-context-label",
    viewSwitch: "#bookings-view-switch",
    createButton: "#booking-create-btn",
    modal: "#booking-modal",
    modalTitle: "#booking-modal-title",
    modalClose: "#booking-modal-close",
    form: "#booking-form",
    submitButton: "#booking-submit",
    cancelButton: "#booking-cancel"
  },
  columns: 8,
  responseKey: "bookings",
  endpoints: {
    list: "/api/bookings",
    create: "/api/bookings",
    update: (id) => `/api/bookings/${id}`,
    remove: (id) => `/api/bookings/${id}`,
    updateStatus: (id) => `/api/bookings/${id}/status`
  },
  messages: {
    empty: "No hay reservas para esta vista.",
    created: "Reserva creada.",
    updated: "Reserva actualizada.",
    deleted: "Reserva eliminada.",
    statusUpdated: "Estado actualizado."
  },
  modalTitles: {
    create: "Nueva reserva",
    update: "Editar reserva"
  },
  submitLabels: {
    create: "Guardar reserva",
    update: "Actualizar reserva"
  },
  readHiddenId: (formData) => formData.booking_id,
  setHiddenId: (form, value) => {
    form.booking_id.value = value;
  },
  buildPayload: (formData) => ({
    nombre_cliente: formData.nombre_cliente,
    fecha: formData.fecha,
    hora: formData.hora,
    numero_personas: toNumber(formData.numero_personas),
    comentarios: formData.comentarios
  }),
  fillForm: (form, item) => {
    form.booking_id.value = String(item.id);
    form.nombre_cliente.value = item.nombre_cliente;
    form.fecha.value = item.fecha;
    form.hora.value = item.hora;
    form.numero_personas.value = String(item.numero_personas);
    form.comentarios.value = item.comentarios ?? "";
  },
  getScopeLabel: (user, scope) => {
    if (user.role === "customer") return "Estas viendo tus reservas.";
    return scope === "others"
      ? "Estas viendo las reservas creadas por otros usuarios."
      : "Estas viendo tus reservas.";
  },
  renderRow: (booking, user) => {
    const canEdit = user.role === "admin" || user.role === "staff" || booking.user_id === user.id;

    return `
      <td class="admin-col-id" data-label="ID">${escapeHtml(booking.id)}</td>
      <td class="admin-col-client" data-label="Cliente">${escapeHtml(booking.nombre_cliente)}</td>
      <td data-label="Fecha">${escapeHtml(booking.fecha)}</td>
      <td data-label="Hora">${escapeHtml(booking.hora)}</td>
      <td data-label="Personas">${booking.numero_personas}</td>
      <td class="admin-col-comments" data-label="Comentarios">${escapeHtml(booking.comentarios || "-")}</td>
      <td data-label="Estado">
        ${
          user.role === "admin" || user.role === "staff"
            ? `<select class="admin-select admin-select-compact" data-action="status" data-id="${escapeHtml(booking.id)}">
                ${BOOKING_STATUS.map(
                  (status) =>
                    `<option value="${status}" ${booking.status_name === status ? "selected" : ""}>${status}</option>`
                ).join("")}
              </select>`
            : `<span class="admin-pill-status">${escapeHtml(booking.status_name)}</span>`
        }
      </td>
      <td class="admin-row-actions" data-label="Acciones">
        ${
          canEdit
            ? `<button data-action="edit" data-id="${escapeHtml(booking.id)}" class="admin-btn admin-btn-soft">Editar</button>
               <button data-action="delete" data-id="${escapeHtml(booking.id)}" class="admin-btn admin-btn-danger">Eliminar</button>`
            : "-"
        }
      </td>
    `;
  }
});
