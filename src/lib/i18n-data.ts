import type { Locale } from '../utils/seo';

const globEager = import.meta.glob('../data/*/labels.json', { eager: true }) as Record<string, { default: Record<string, unknown> }>;
const globHero = import.meta.glob('../data/*/hero.json', { eager: true }) as Record<string, { default: HeroData }>;
const globAbout = import.meta.glob('../data/*/about.json', { eager: true }) as Record<string, { default: AboutData }>;
const globMenu = import.meta.glob('../data/*/menu.json', { eager: true }) as Record<string, { default: unknown }>;
const globMenuPage = import.meta.glob('../data/*/menu-page.json', { eager: true }) as Record<string, { default: MenuPageData }>;
const globGallery = import.meta.glob('../data/*/gallery.json', { eager: true }) as Record<string, { default: GalleryData }>;
const globContact = import.meta.glob('../data/*/contact.json', { eager: true }) as Record<string, { default: ContactData }>;
const globFaq = import.meta.glob('../data/*/faq.json', { eager: true }) as Record<string, { default: FaqData }>;
const globEvents = import.meta.glob('../data/*/events.json', { eager: true }) as Record<string, { default: EventsData }>;
const globReviewsUi = import.meta.glob('../data/*/reviews-ui.json', { eager: true }) as Record<string, { default: unknown }>;
const globRedirects = import.meta.glob('../data/es/redirects.json', { eager: true }) as Record<string, { default: unknown }>;
const reviewsData = import.meta.glob('../data/reviews/reviews.json', { eager: true }) as Record<string, { default: unknown }>;

export interface HeroData {
  seo: { title: string; description: string };
  title: string;
  subtitle: string;
  philosophy: string;
  viewMenu: string;
  reserveTable: string;
  homeSeoSection: {
    heading: string;
    paragraphOne: string;
    paragraphTwo: string;
    paragraphThree: {
      beforeMenuLink: string;
      menuLinkText: string;
      betweenLinks: string;
      reserveLinkText: string;
      afterReserveLink: string;
    };
    testimonials: { text: string }[];
    whyChooseUs: { title: string; description: string }[];
  };
  essence: { title: string; description: string; ctaText: string; ctaLink: string };
  cards: {
    menu: { title: string; subtitle: string };
    gallery: { title: string; subtitle: string };
    reservations: { title: string; subtitle: string };
  };
}

export interface AboutData {
  seo: { title: string; description: string };
  header: { label: string; title: string };
  philosophy: { title: string; description: string; promise: string };
  carolina: { label: string; name: string; paragraphs: string[] };
  mauricio: { label: string; name: string; paragraphs: string[] };
  mediaPlaceholders: { carolina: string; mauricio: string };
}

export interface MenuPageData {
  seo: { title: string; description: string };
  header: { label: string; title: string; description: string };
  filters: { all: string; vegetarian: string; pastas: string; wines: string; desserts: string; drinks: string };
}

export interface GalleryData {
  seo: { title: string; description: string };
  header: { label: string; title: string; description: string };
  media: { videoNotSupported: string };
  items: { src: string; alt: string; type: 'image' | 'video' | string }[];
}

export interface ContactData {
  location: {
    label: string;
    streetAddress: string;
    city: string;
    state: string;
    country: string;
    mapLink?: string;
    mapEmbedUrl?: string;
    wazeLink?: string;
    latitude: number;
    longitude: number;
  };
  family: { title: string; founded: string; owners: string; philosophy: string; cta: string };
  whatsapp: { label: string; description: string; phoneNumber: string; message: string };
  ui: {
    title: string;
    map: { title: string; google: string; waze: string; openAria: string; iframeTitle: string };
    aboutAria: string;
    social: { instagramAria: string; facebookAria: string };
  };
}

export interface FaqData {
  label: string;
  title: string;
  items: { question: string; answer: string }[];
}

export interface EventsData {
  label: string;
  title: string;
  events: { name: string; description: string; badge: string }[];
}

export interface ReviewsUiData {
  section: { label: string; title: string };
  cta: string;
  googleMapsLink: string;
  controls: { prev: string; next: string };
}

function getLocaleKey(lang: Locale, file: string): string {
  return `../data/${lang}/${file}`;
}

function getKey<T>(lang: Locale, glob: Record<string, { default: T }>, file: string): T {
  const key = getLocaleKey(lang, file);
  const entry = glob[key];
  if (!entry) {
    throw new Error(`[i18n-data] File not found: ${key}`);
  }
  return entry.default;
}

export function getLabelsData(lang: Locale): Record<string, unknown> {
  const key = getLocaleKey(lang, 'labels.json');
  return globEager[key]?.default ?? {} as Record<string, unknown>;
}

export function getHeroData(lang: Locale): HeroData {
  return getKey(lang, globHero, 'hero.json');
}

export function getAboutData(lang: Locale): AboutData {
  return getKey(lang, globAbout, 'about.json');
}

export function getMenuData(lang: Locale): unknown {
  return getKey(lang, globMenu, 'menu.json');
}

export function getMenuPageData(lang: Locale): MenuPageData {
  return getKey(lang, globMenuPage, 'menu-page.json');
}

export function getGalleryData(lang: Locale): GalleryData {
  return getKey(lang, globGallery, 'gallery.json');
}

export function getContactData(lang: Locale): ContactData {
  return getKey(lang, globContact, 'contact.json');
}

export function getFaqData(lang: Locale): FaqData {
  return getKey(lang, globFaq, 'faq.json');
}

export function getEventsData(lang: Locale): EventsData {
  return getKey(lang, globEvents, 'events.json');
}

export function getReviewsUiData(lang: Locale): unknown {
  return getKey(lang, globReviewsUi, 'reviews-ui.json');
}

export function getReviewsData(): unknown {
  const key = '../data/reviews/reviews.json';
  return reviewsData[key]?.default;
}

export function getRedirectsData(): unknown {
  const key = '../data/es/redirects.json';
  return globRedirects[key]?.default;
}
