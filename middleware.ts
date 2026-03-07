export default function middleware(request: Request) {
  const url = new URL(request.url);

  // Only redirect from root to avoid loops.
  if (url.pathname !== '/') {
    return;
  }

  const acceptLanguage = (request.headers.get('accept-language') || '').toLowerCase();
  const destination = acceptLanguage.startsWith('en') ? '/en/' : '/es/';

  const response = Response.redirect(new URL(destination, url), 307);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Vary', 'Accept-Language');
  return response;
}
