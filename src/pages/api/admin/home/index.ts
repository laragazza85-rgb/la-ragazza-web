import type { APIRoute } from 'astro';
import { listHomeTranslations } from '../../../../server/admin/homePageTranslations';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const rows = await listHomeTranslations();

    return new Response(JSON.stringify({ ok: true, data: rows }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
};

