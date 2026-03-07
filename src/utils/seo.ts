import reviewsData from '../data/reviews/reviews.json';

export type Locale = 'es' | 'en';

const SUPPORTED_LOCALES: Locale[] = ['es', 'en'];

export const SITE_URL = 'https://la-ragazza-web.vercel.app';
const BUSINESS_NAME = 'Restaurante La Ragazza';
const BUSINESS_PHONE = '+573133494150';
const WHATSAPP_URL = 'https://wa.me/573133494150';
const MAP_EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3979.42822969437!2d-73.640488725024!3d4.135852395837936!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3e2e0dd4ef0e2b%3A0x620e030c40531d13!2sLa%20Ragazza!5e0!3m2!1ses!2sco!4v1772854114551!5m2!1ses!2sco';
const SAME_AS = [
  'https://www.instagram.com/laragazza85/',
  'https://www.facebook.com/laragazza85/',
];

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
    '@id': `${SITE_URL}/#restaurant`,
    name: BUSINESS_NAME,
    image: imageUrl,
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
