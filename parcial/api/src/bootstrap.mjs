import { runMigrations } from "./db/migrate.mjs";
import { seedCatalogs, seedDefaultAdmin } from "./db/seed.mjs";

export async function bootstrapDatabase() {
  runMigrations();
  seedCatalogs();
  await seedDefaultAdmin();
}

