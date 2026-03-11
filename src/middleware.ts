import { defineMiddleware } from 'astro:middleware';

const ADMIN_HOSTS = new Set(['admin.localhost', 'admin.la-ragazza-web.com']);

const PUBLIC_FILE = /\.[^/]+$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, redirect } = context;
  const host = request.headers.get('host')?.split(':')[0].toLowerCase() ?? '';
  const isAdminHost = ADMIN_HOSTS.has(host);

  // Static assets and framework internals should bypass host rewrites.
  if (PUBLIC_FILE.test(url.pathname) || url.pathname.startsWith('/_astro')) {
    return next();
  }

  if (isAdminHost) {
    if (url.pathname === '/') {
      return redirect('/admin', 307);
    }

    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api/admin')) {
      return redirect('/admin', 307);
    }

    return next();
  }

  // Keep current language redirect behavior in non-admin hosts.
  if (url.pathname === '/') {
    const acceptLanguage = (request.headers.get('accept-language') || '').toLowerCase();
    const destination = acceptLanguage.startsWith('en') ? '/en/' : '/es/';
    return redirect(destination, 307);
  }

  return next();
});

