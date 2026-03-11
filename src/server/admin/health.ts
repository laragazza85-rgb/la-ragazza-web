import { getDbPool } from '../db/client';

export type AdminHealth = {
  ok: boolean;
  service: 'admin-api';
  db: 'up' | 'down';
  latencyMs: number;
  timestamp: string;
  error?: string;
};

export async function getAdminHealth(): Promise<AdminHealth> {
  const started = performance.now();

  try {
    const pool = getDbPool();
    await pool.query('SELECT 1');

    return {
      ok: true,
      service: 'admin-api',
      db: 'up',
      latencyMs: Math.round(performance.now() - started),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      service: 'admin-api',
      db: 'down',
      latencyMs: Math.round(performance.now() - started),
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

