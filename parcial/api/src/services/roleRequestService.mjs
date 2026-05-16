import { HttpError } from "../utils/httpError.mjs";
import { roleRequestRepository } from "../repositories/roleRequestRepository.mjs";

const REQUEST_STATUS = new Set(["active", "approved", "rejected", "cancelled"]);
const REQUESTED_ROLES = new Set(["customer", "staff", "admin"]);

function ensureCanAccess(request, user) {
  if (!request) throw new HttpError(404, "Solicitud no encontrada.");
  if (user.role !== "admin" && request.user_id !== user.id) {
    throw new HttpError(403, "No tienes permisos para esta solicitud.");
  }
}

function ensureRequestIsActive(request) {
  if (request.is_active !== 1) {
    throw new HttpError(409, "La solicitud ya fue resuelta y no se puede modificar.");
  }
}

function validateRequestData(body) {
  const requestedRole = String(body.requested_role ?? "").trim().toLowerCase();
  const justification = String(body.justification ?? "").trim();

  if (!requestedRole || !justification) {
    throw new HttpError(400, "requested_role y justification son obligatorios.");
  }

  if (justification.length < 12) {
    throw new HttpError(400, "La justificacion debe tener al menos 12 caracteres.");
  }

  if (justification.length > 1200) {
    throw new HttpError(400, "La justificacion no debe superar 1200 caracteres.");
  }

  if (!REQUESTED_ROLES.has(requestedRole)) {
    throw new HttpError(400, "requested_role invalido.");
  }

  return { requestedRole, justification };
}

export const roleRequestService = {
  async list(auth) {
    return auth.user.role === "admin"
      ? roleRequestRepository.listAll(auth.supabase)
      : roleRequestRepository.listByUser(auth.supabase, auth.user.id);
  },

  async getById(id, auth) {
    const request = await roleRequestRepository.findById(auth.supabase, id);
    ensureCanAccess(request, auth.user);
    return request;
  },

  async create(body, auth) {
    const payload = validateRequestData(body);

    return roleRequestRepository.create(auth.supabase, {
      userId: auth.user.id,
      requestedRole: payload.requestedRole,
      justification: payload.justification
    });
  },

  async update(id, body, auth) {
    const current = await roleRequestRepository.findById(auth.supabase, id);
    ensureCanAccess(current, auth.user);
    ensureRequestIsActive(current);

    const payload = validateRequestData(body);

    return roleRequestRepository.update(auth.supabase, id, {
      requestedRole: payload.requestedRole,
      justification: payload.justification
    });
  },

  async remove(id, auth) {
    const current = await roleRequestRepository.findById(auth.supabase, id);
    ensureCanAccess(current, auth.user);

    ensureRequestIsActive(current);

    await roleRequestRepository.remove(auth.supabase, id);
  },

  async updateStatus(id, status, auth) {
    if (auth.user.role !== "admin") {
      throw new HttpError(403, "Solo admin puede cambiar estado de solicitudes.");
    }

    const normalizedStatus = String(status ?? "").trim().toLowerCase();
    if (!REQUEST_STATUS.has(normalizedStatus)) {
      throw new HttpError(400, "Estado de solicitud invalido.");
    }

    const current = await roleRequestRepository.findById(auth.supabase, id);
    if (!current) throw new HttpError(404, "Solicitud no encontrada.");
    ensureRequestIsActive(current);

    const updated = await roleRequestRepository.updateStatus(auth.supabase, id, normalizedStatus);

    console.log(`[roleRequestService] updateStatus -> id=${id} status=${normalizedStatus} updatedRequestUser=${updated.user_id}`);
    if (normalizedStatus === "approved") {
      console.log("[roleRequestService] calling applyApprovedRole for user", updated.user_id);
      const result = await roleRequestRepository.applyApprovedRole(auth.supabase, updated.user_id, updated.requested_role);
      console.log("[roleRequestService] applyApprovedRole returned:", result);
    }

    return updated;
  }
};

