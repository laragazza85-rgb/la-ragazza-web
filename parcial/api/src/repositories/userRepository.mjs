import { db } from "../db/connection.mjs";

const USER_SELECT = `SELECT u.id, u.email, u.password_hash, u.role_id, u.created_at, r.name AS role_name
                     FROM users u
                     JOIN user_roles r ON r.id = u.role_id`;

export const userRepository = {
  findByEmail(email) {
    return db.prepare(`${USER_SELECT} WHERE lower(u.email) = ?`).get(String(email ?? "").trim().toLowerCase());
  },

  findById(id) {
    return db.prepare(`${USER_SELECT} WHERE u.id = ?`).get(id);
  },

  create({ email, passwordHash, roleName = "user" }) {
    const role = db.prepare("SELECT id FROM user_roles WHERE name = ?").get(roleName);
    const result = db
      .prepare(
        `INSERT INTO users (email, password_hash, role_id)
         VALUES (?, ?, ?)`
      )
      .run(email, passwordHash, role.id);

    return this.findById(result.lastInsertRowid);
  }
};
