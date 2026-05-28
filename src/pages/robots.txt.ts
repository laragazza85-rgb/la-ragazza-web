import type { APIRoute } from 'astro';
import { SITE_URL } from '../lib/business-constants';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString() ?? SITE_URL;
  const sitemapUrl = new URL('/sitemap-index.xml', origin).toString();

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Admin',
    'Disallow: /admin/',
    'Disallow: /wp-admin/',
    '',
    '# Internal search/query params',
    'Disallow: /*?*q=',
    'Disallow: /*?*s=',
    'Disallow: /*?*search=',
    'Disallow: /*?*buscar=',
    '',
    `# Host: ${origin}`,
    'Crawl-delay: 1',
    '',
    `Sitemap: ${sitemapUrl}`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
