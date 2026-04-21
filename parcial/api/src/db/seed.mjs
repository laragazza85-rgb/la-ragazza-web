import bcrypt from "bcryptjs";
import { env } from "../config/env.mjs";
import { db } from "./connection.mjs";

const DEFAULT_ROLES = ["admin", "user"];
const DEFAULT_STATUS = ["pending", "confirmed", "cancelled", "completed"];

function upsertRole(name) {
  db.prepare("INSERT OR IGNORE INTO user_roles(name) VALUES(?)").run(name);
}

function upsertStatus(name) {
  db.prepare("INSERT OR IGNORE INTO booking_status(name) VALUES(?)").run(name);
}

export function seedCatalogs() {
  for (const role of DEFAULT_ROLES) upsertRole(role);
  for (const status of DEFAULT_STATUS) upsertStatus(status);
}

export async function seedDefaultAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(env.ADMIN_EMAIL.toLowerCase());
  if (existing) return;

  const adminRole = db.prepare("SELECT id FROM user_roles WHERE name = 'admin'").get();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  db.prepare(
    `INSERT INTO users (email, password_hash, role_id)
     VALUES (?, ?, ?)`
  ).run(env.ADMIN_EMAIL.toLowerCase(), passwordHash, adminRole.id);
}
