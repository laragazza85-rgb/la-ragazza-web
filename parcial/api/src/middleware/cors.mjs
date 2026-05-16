import { env } from "../config/env.mjs";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "https://la-ragazza-web.vercel.app",
  "https://la-ragazza-web-parcial.vercel.app"
];

function splitOrigins(value) {
  return String(value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...splitOrigins(env.PUBLIC_SITE_URL),
  ...splitOrigins(env.CORS_ALLOWED_ORIGINS)
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (allowedOrigins.has("*")) return true;
  return allowedOrigins.has(origin);
}

export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(isAllowedOrigin(origin) ? 204 : 403);
  }

  return next();
}
