import { HttpError } from "../utils/httpError.mjs";
import { roleRequestRepository } from "../repositories/roleRequestRepository.mjs";

const REQUEST_STATUS = new Set(["active", "approved", "rejected", "cancelled"]);

function ensureCanAccess(request, user) {
  if (!request) throw new HttpError(404, "Solicitud no encontrada.");
  if (user.role !== "admin" && request.user_id !== user.id) {
    throw new HttpError(403, "No tienes permisos para esta solicitud.");
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

  return { requestedRole, justification };
}

export const roleRequestService = {
  list(user) {
    return user.role === "admin"
      ? roleRequestRepository.listAll()
      : roleRequestRepository.listByUser(user.id);
  },

  getById(id, user) {
    const request = roleRequestRepository.findById(id);
    ensureCanAccess(request, user);
    return request;
  },

  create(body, user) {
    const payload = validateRequestData(body);
    const role = roleRequestRepository.findRoleByName(payload.requestedRole);

    if (!role) throw new HttpError(400, "Rol solicitado invalido.");

    return roleRequestRepository.create({
      userId: user.id,
      requestedRoleId: role.id,
      justification: payload.justification
    });
  },

  update(id, body, user) {
    const current = roleRequestRepository.findById(id);
    ensureCanAccess(current, user);

    if (user.role !== "admin" && current.is_active !== 1) {
      throw new HttpError(409, "Solo puedes editar solicitudes activas.");
    }

    const payload = validateRequestData(body);
    const role = roleRequestRepository.findRoleByName(payload.requestedRole);
    if (!role) throw new HttpError(400, "Rol solicitado invalido.");

    return roleRequestRepository.update(id, {
      requestedRoleId: role.id,
      justification: payload.justification
    });
  },

  remove(id, user) {
    const current = roleRequestRepository.findById(id);
    ensureCanAccess(current, user);

    if (user.role !== "admin" && current.is_active !== 1) {
      throw new HttpError(409, "Solo puedes eliminar solicitudes activas.");
    }

    roleRequestRepository.remove(id);
  },

  updateStatus(id, status, user) {
    if (user.role !== "admin") {
      throw new HttpError(403, "Solo admin puede cambiar estado de solicitudes.");
    }

    const normalizedStatus = String(status ?? "").trim().toLowerCase();
    if (!REQUEST_STATUS.has(normalizedStatus)) {
      throw new HttpError(400, "Estado de solicitud invalido.");
    }

    const current = roleRequestRepository.findById(id);
    if (!current) throw new HttpError(404, "Solicitud no encontrada.");

    const updated = roleRequestRepository.updateStatus(id, normalizedStatus);

    if (normalizedStatus === "approved") {
      roleRequestRepository.applyApprovedRole(updated.user_id, updated.requested_role_id);
    }

    return updated;
  }
};

