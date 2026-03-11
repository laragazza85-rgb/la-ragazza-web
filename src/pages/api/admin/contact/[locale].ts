import type { APIRoute } from 'astro';
import {
  getContactDetail,
  parseContactDetailInput,
  updateContactDetail,
} from '../../../../server/admin/contactProfile';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const locale = params.locale ?? '';
    const row = await getContactDetail(locale);

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data: row }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: message.startsWith('Unsupported locale') ? 400 : 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const locale = params.locale ?? '';
    const body = await request.json();
    const payload = parseContactDetailInput(body);
    const row = await updateContactDetail(locale, payload);

    if (!row) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data: row }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const isBadRequest =
      message.startsWith('Unsupported locale') || message.startsWith('Field') || message === 'Invalid JSON payload';

    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: isBadRequest ? 400 : 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
};

