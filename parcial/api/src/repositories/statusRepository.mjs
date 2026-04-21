import { db } from "../db/connection.mjs";

export const statusRepository = {
  findByName(name) {
    return db.prepare("SELECT id, name FROM booking_status WHERE name = ?").get(name);
  },

  listAll() {
    return db.prepare("SELECT id, name FROM booking_status ORDER BY id ASC").all();
  }
};

