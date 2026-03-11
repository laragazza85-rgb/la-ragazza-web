import type { APIRoute } from 'astro';
import { getAdminHealth } from '../../../server/admin/health';

export const prerender = false;

export const GET: APIRoute = async () => {
  const health = await getAdminHealth();

  return new Response(JSON.stringify(health), {
    status: health.ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

