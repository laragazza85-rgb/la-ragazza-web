export function middleware(request: Request) {
  const url = new URL(request.url);

  // Only redirect from root to avoid loops.
  if (url.pathname !== '/') {
    return;
  }

  const acceptLanguage = (request.headers.get('accept-language') || '').toLowerCase();
  const destination = acceptLanguage.startsWith('en') ? '/en/' : '/es/';

  return Response.redirect(new URL(destination, url), 307);
}
