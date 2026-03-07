export default function middleware(request: Request) {
  const url = new URL(request.url);

  // Only redirect from root to avoid loops.
  if (url.pathname !== '/') {
    return fetch(request);
  }

  const acceptLanguage = (request.headers.get('accept-language') || '').toLowerCase();
  const destination = acceptLanguage.startsWith('en') ? '/en/' : '/es/';

  return new Response(null, {
    status: 307,
    headers: {
      Location: new URL(destination, url).toString(),
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language',
    },
  });
}
