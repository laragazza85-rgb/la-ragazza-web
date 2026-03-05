export type Locale = 'es' | 'en';

const SUPPORTED_LOCALES: Locale[] = ['es', 'en'];

function stripLocalePrefix(pathname: string): string {
  const cleanPath = pathname.split('?')[0].split('#')[0] || '/';
  return cleanPath.replace(/^\/(es|en)(?=\/|$)/, '') || '/';
}

function localePath(pathname: string, locale: Locale): string {
  const suffix = stripLocalePrefix(pathname);
  const normalizedSuffix = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `/${locale}${normalizedSuffix}`.replace(/\/{2,}/g, '/');
}

function toHref(path: string, baseOrigin?: string): string {
  return baseOrigin ? new URL(path, baseOrigin).toString() : path;
}

export function buildCanonicalUrl(pathname: string, baseOrigin: string | undefined, lang: Locale): string {
  const canonicalPath = localePath(pathname, lang);
  return toHref(canonicalPath, baseOrigin);
}

export function buildAlternateLinks(pathname: string, baseOrigin?: string) {
  return SUPPORTED_LOCALES.map((locale) => ({
    hreflang: locale,
    href: toHref(localePath(pathname, locale), baseOrigin),
  }));
}

export function buildXDefault(pathname: string, baseOrigin?: string): string {
  return toHref(localePath(pathname, 'es'), baseOrigin);
}

export function buildRestaurantJsonLd(params: {
  lang: Locale;
  pageUrl: string;
  imageUrl: string;
}) {
  const { lang, pageUrl, imageUrl } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'La Ragazza Ristorante',
    image: imageUrl,
    url: pageUrl,
    telephone: '+57 3133494150',
    servesCuisine: 'Italian',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Villavicencio',
      addressRegion: 'Meta',
      addressCountry: 'CO',
    },
    inLanguage: lang,
    sameAs: ['https://maps.google.com/?q=La+Ragazza+Ristorante+Villavicencio'],
  };
}
