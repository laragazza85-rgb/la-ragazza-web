import { db } from "./connection.mjs";

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES user_roles(id)
    );

    CREATE TABLE IF NOT EXISTS booking_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nombre_cliente TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      numero_personas INTEGER NOT NULL CHECK (numero_personas > 0),
      comentarios TEXT NOT NULL DEFAULT '',
      status_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (status_id) REFERENCES booking_status(id)
    );

    CREATE TABLE IF NOT EXISTS role_change_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      requested_role_id INTEGER NOT NULL,
      justification TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'approved', 'rejected', 'cancelled')),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (requested_role_id) REFERENCES user_roles(id)
    );

    CREATE TRIGGER IF NOT EXISTS bookings_updated_at
    AFTER UPDATE ON bookings
    FOR EACH ROW
    BEGIN
      UPDATE bookings
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;

    CREATE TRIGGER IF NOT EXISTS role_change_requests_updated_at
    AFTER UPDATE ON role_change_requests
    FOR EACH ROW
    BEGIN
      UPDATE role_change_requests
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.id;
    END;
  `);

  if (!hasColumn("bookings", "comentarios")) {
    db.exec("ALTER TABLE bookings ADD COLUMN comentarios TEXT NOT NULL DEFAULT '';");
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users(lower(email));
  `);
}
