import reviewsData from '../data/reviews/reviews.json';
import {
  SITE_URL,
  BUSINESS_NAME,
  BUSINESS_PHONE,
  WHATSAPP_URL,
  MAP_EMBED_URL,
  SAME_AS,
} from '../lib/business-constants';

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
}) {
  const { lang, pageUrl } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${SITE_URL}/#restaurant`,
    name: BUSINESS_NAME,
    url: SITE_URL,
    mainEntityOfPage: pageUrl,
    telephone: BUSINESS_PHONE,
    priceRange: '$$',
    servesCuisine: ['Italian', 'Pasta', 'Comida italiana artesanal'],
    keywords: 'familiar, artesanal, italiano, comida italiana, familia, pasta, hecho en casa',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Calle 19 #39-66, Barrio Camoa',
      addressLocality: 'Villavicencio',
      addressRegion: 'Meta',
      addressCountry: 'CO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 4.135852395837936,
      longitude: -73.640488725024,
    },
    hasMap: MAP_EMBED_URL,
    identifier: '49P6+8R Villavicencio, Meta',
    menu: `${SITE_URL}/${lang}/menu`,
    sameAs: SAME_AS,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviewsData.averageRating,
      reviewCount: reviewsData.reviewCount,
    },
    openingHours: [
      'Mo Closed',
      'Tu-Fr 12:00-15:00',
      'Tu-Fr 18:00-21:30',
      'Sa 12:00-15:30',
      'Sa 18:00-21:30',
      'Su 12:00-17:30',
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'https://schema.org/Tuesday',
          'https://schema.org/Wednesday',
          'https://schema.org/Thursday',
          'https://schema.org/Friday',
        ],
        opens: '12:00',
        closes: '15:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'https://schema.org/Tuesday',
          'https://schema.org/Wednesday',
          'https://schema.org/Thursday',
          'https://schema.org/Friday',
        ],
        opens: '18:00',
        closes: '21:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Saturday',
        opens: '12:00',
        closes: '15:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Saturday',
        opens: '18:00',
        closes: '21:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Sunday',
        opens: '12:00',
        closes: '17:30',
      },
    ],
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: WHATSAPP_URL,
        inLanguage: ['es', 'en'],
        actionPlatform: [
          'https://schema.org/DesktopWebPlatform',
          'https://schema.org/MobileWebPlatform',
        ],
      },
      result: {
        '@type': 'FoodEstablishmentReservation',
        name: BUSINESS_NAME,
      },
    },
    inLanguage: lang,
  };
}
