import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiRoot = path.resolve(__dirname, "../..");
const defaultDbPath = path.join(apiRoot, "db", "parcial.db");

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PARCIAL_PORT ?? 3001),
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-change-me",
  DB_PATH: process.env.PARCIAL_DB_PATH ?? defaultDbPath,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@laragazza.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "Admin1234!"
};

export const isProduction = env.NODE_ENV === "production";

