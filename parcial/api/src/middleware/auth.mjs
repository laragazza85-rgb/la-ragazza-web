import { HttpError } from "../utils/httpError.mjs";

export function requireAuth(req, _res, next) {
  if (!req.session?.user) {
    return next(new HttpError(401, "Sesion requerida."));
  }
  return next();
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (!req.session?.user) {
      return next(new HttpError(401, "Sesion requerida."));
    }

    if (req.session.user.role !== role) {
      return next(new HttpError(403, "No autorizado."));
    }

    return next();
  };
}

export function requireAdminOrOwner(getOwnerId) {
  return (req, _res, next) => {
    if (!req.session?.user) {
      return next(new HttpError(401, "Sesion requerida."));
    }

    if (req.session.user.role === "admin") return next();

    const ownerId = getOwnerId(req);
    if (Number(ownerId) !== req.session.user.id) {
      return next(new HttpError(403, "No autorizado."));
    }

    return next();
  };
}

