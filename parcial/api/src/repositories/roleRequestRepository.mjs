import { db } from "../db/connection.mjs";

const requestColumns = `
  rr.id,
  rr.user_id,
  rr.requested_role_id,
  ur.name AS requested_role,
  rr.justification,
  rr.status,
  rr.is_active,
  rr.created_at,
  rr.updated_at,
  u.email AS requester_email
`;

export const roleRequestRepository = {
  findRoleByName(roleName) {
    return db.prepare("SELECT id, name FROM user_roles WHERE name = ?").get(roleName);
  },

  create({ userId, requestedRoleId, justification }) {
    const result = db
      .prepare(
        `INSERT INTO role_change_requests (user_id, requested_role_id, justification)
         VALUES (?, ?, ?)`
      )
      .run(userId, requestedRoleId, justification);

    return this.findById(result.lastInsertRowid);
  },

  listAll() {
    return db
      .prepare(
        `SELECT ${requestColumns}
         FROM role_change_requests rr
         JOIN user_roles ur ON ur.id = rr.requested_role_id
         JOIN users u ON u.id = rr.user_id
         ORDER BY rr.created_at DESC`
      )
      .all();
  },

  listByUser(userId) {
    return db
      .prepare(
        `SELECT ${requestColumns}
         FROM role_change_requests rr
         JOIN user_roles ur ON ur.id = rr.requested_role_id
         JOIN users u ON u.id = rr.user_id
         WHERE rr.user_id = ?
         ORDER BY rr.created_at DESC`
      )
      .all(userId);
  },

  findById(id) {
    return db
      .prepare(
        `SELECT ${requestColumns}
         FROM role_change_requests rr
         JOIN user_roles ur ON ur.id = rr.requested_role_id
         JOIN users u ON u.id = rr.user_id
         WHERE rr.id = ?`
      )
      .get(id);
  },

  update(id, { requestedRoleId, justification }) {
    db.prepare(
      `UPDATE role_change_requests
       SET requested_role_id = ?,
           justification = ?
       WHERE id = ?`
    ).run(requestedRoleId, justification, id);

    return this.findById(id);
  },

  updateStatus(id, status) {
    const isActive = status === "active" ? 1 : 0;

    db.prepare(
      `UPDATE role_change_requests
       SET status = ?, is_active = ?
       WHERE id = ?`
    ).run(status, isActive, id);

    return this.findById(id);
  },

  applyApprovedRole(userId, roleId) {
    db.prepare("UPDATE users SET role_id = ? WHERE id = ?").run(roleId, userId);
  },

  remove(id) {
    db.prepare("DELETE FROM role_change_requests WHERE id = ?").run(id);
  }
};

