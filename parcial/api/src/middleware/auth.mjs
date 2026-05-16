import { HttpError } from "../utils/httpError.mjs";
import { resolveRequestAuth } from "../lib/supabase.mjs";

async function attachAuth(req) {
  if (req.auth) return req.auth;
  const auth = await resolveRequestAuth(req);
  req.auth = auth;
  req.user = auth.user;
  return auth;
}

export async function requireAuth(req, _res, next) {
  try {
    await attachAuth(req);
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(role) {
  return async (req, _res, next) => {
    try {
      const auth = await attachAuth(req);

      if (auth.user.role !== role) {
        throw new HttpError(403, "No autorizado.");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function requireAdminOrOwner(getOwnerId) {
  return async (req, _res, next) => {
    try {
      const auth = await attachAuth(req);

      if (auth.user.role === "admin") return next();

      const ownerId = String(getOwnerId(req) ?? "");
      if (ownerId !== auth.user.id) {
        throw new HttpError(403, "No autorizado.");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

