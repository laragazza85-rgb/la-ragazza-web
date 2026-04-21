import { HttpError } from "../utils/httpError.mjs";

export function notFoundHandler(_req, _res, next) {
  next(new HttpError(404, "Ruta no encontrada."));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.statusCode ?? 500;
  const message = status === 500 ? "Error interno del servidor." : err.message;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ error: message });
}

