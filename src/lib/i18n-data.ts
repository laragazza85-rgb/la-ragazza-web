import type { Locale } from '../utils/seo';

const globEager = import.meta.glob('../data/*/labels.json', { eager: true }) as Record<string, { default: Record<string, unknown> }>;
const globHero = import.meta.glob('../data/*/hero.json', { eager: true }) as Record<string, { default: unknown }>;
const globAbout = import.meta.glob('../data/*/about.json', { eager: true }) as Record<string, { default: unknown }>;
const globMenu = import.meta.glob('../data/*/menu.json', { eager: true }) as Record<string, { default: unknown }>;
const globMenuPage = import.meta.glob('../data/*/menu-page.json', { eager: true }) as Record<string, { default: unknown }>;
const globGallery = import.meta.glob('../data/*/gallery.json', { eager: true }) as Record<string, { default: unknown }>;
const globContact = import.meta.glob('../data/*/contact.json', { eager: true }) as Record<string, { default: unknown }>;
const globFaq = import.meta.glob('../data/*/faq.json', { eager: true }) as Record<string, { default: unknown }>;
const globEvents = import.meta.glob('../data/*/events.json', { eager: true }) as Record<string, { default: unknown }>;
const globReviewsUi = import.meta.glob('../data/*/reviews-ui.json', { eager: true }) as Record<string, { default: unknown }>;
const globRedirects = import.meta.glob('../data/es/redirects.json', { eager: true }) as Record<string, { default: unknown }>;
const reviewsData = import.meta.glob('../data/reviews/reviews.json', { eager: true }) as Record<string, { default: unknown }>;

function getLocaleKey(lang: Locale, file: string): string {
  return `../data/${lang}/${file}`;
}

function getKey(lang: Locale, glob: Record<string, unknown>, file: string): unknown {
  const key = getLocaleKey(lang, file);
  const entry = glob[key];
  if (!entry) {
    throw new Error(`[i18n-data] File not found: ${key}`);
  }
  return (entry as { default: unknown }).default;
}

export function getLabelsData(lang: Locale): Record<string, unknown> {
  return getKey(lang, globEager, 'labels.json') as Record<string, unknown>;
}

export function getHeroData(lang: Locale): unknown {
  return getKey(lang, globHero, 'hero.json');
}

export function getAboutData(lang: Locale): unknown {
  return getKey(lang, globAbout, 'about.json');
}

export function getMenuData(lang: Locale): unknown {
  return getKey(lang, globMenu, 'menu.json');
}

export function getMenuPageData(lang: Locale): unknown {
  return getKey(lang, globMenuPage, 'menu-page.json');
}

export function getGalleryData(lang: Locale): unknown {
  return getKey(lang, globGallery, 'gallery.json');
}

export function getContactData(lang: Locale): unknown {
  return getKey(lang, globContact, 'contact.json');
}

export function getFaqData(lang: Locale): unknown {
  return getKey(lang, globFaq, 'faq.json');
}

export function getEventsData(lang: Locale): unknown {
  return getKey(lang, globEvents, 'events.json');
}

export function getReviewsUiData(lang: Locale): unknown {
  return getKey(lang, globReviewsUi, 'reviews-ui.json');
}

export function getReviewsData(): unknown {
  const key = '../data/reviews/reviews.json';
  const entry = reviewsData[key];
  if (!entry) {
    throw new Error('[i18n-data] reviews.json not found');
  }
  return (entry as { default: unknown }).default;
}

export function getRedirectsData(): unknown {
  const key = '../data/es/redirects.json';
  const entry = globRedirects[key];
  if (!entry) {
    throw new Error('[i18n-data] redirects.json not found');
  }
  return (entry as { default: unknown }).default;
}
