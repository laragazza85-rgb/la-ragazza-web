import { Pool } from 'pg';

let pool: Pool | null = null;

function getConnectionString(): string | undefined {
  // Astro SSR exposes env vars on process.env. Keep this helper explicit for debugging.
  return process.env.DATABASE_URL;
}

export function getDbPool(): Pool {
  if (pool) return pool;

  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Define it in .env (not only .env.example). If running in Docker/Podman, pass DATABASE_URL in docker-compose and avoid localhost for host DB; use host.containers.internal.',
    );
  }

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 3_000,
  });

  return pool;
}
