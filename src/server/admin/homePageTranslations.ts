import { getDbPool } from '../db/client';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type HomePageTranslation = {
  pageKey: 'home';
  localeCode: SupportedLocale;
  title: string;
  subtitle: string;
  philosophy: string;
  viewMenuText: string;
  reserveTableText: string;
  homeSeoHeading: string;
  homeSeoParagraphOne: string;
  homeSeoParagraphTwo: string;
  p3BeforeMenuLink: string;
  p3MenuLinkText: string;
  p3BetweenLinks: string;
  p3ReserveLinkText: string;
  p3AfterReserveLink: string;
  essenceTitleHtml: string;
  essenceDescription: string;
  essenceCtaText: string;
  essenceCtaLink: string;
  updatedAt: string;
};

export type HomeTranslationSummary = {
  pageKey: 'home';
  localeCode: SupportedLocale;
  title: string;
  subtitle: string;
  updatedAt: string;
};

export type HomeTranslationInput = Omit<HomePageTranslation, 'pageKey' | 'localeCode' | 'updatedAt'>;

const PAGE_KEY = 'home';

const HOME_SELECT_SQL = `
  SELECT
    page_key,
    locale_code,
    title,
    subtitle,
    philosophy,
    view_menu_text,
    reserve_table_text,
    home_seo_heading,
    home_seo_paragraph_one,
    home_seo_paragraph_two,
    p3_before_menu_link,
    p3_menu_link_text,
    p3_between_links,
    p3_reserve_link_text,
    p3_after_reserve_link,
    essence_title_html,
    essence_description,
    essence_cta_text,
    essence_cta_link,
    updated_at
  FROM home_page_translation
`;

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function parseLocale(value: string): SupportedLocale {
  if (!isSupportedLocale(value)) {
    throw new Error(`Unsupported locale: ${value}`);
  }

  return value;
}

function asTextRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid JSON payload');
  }

  return value as Record<string, unknown>;
}

function asString(record: Record<string, unknown>, key: string): string {
  const rawValue = record[key];

  if (typeof rawValue !== 'string') {
    throw new Error(`Field ${key} must be a string`);
  }

  return rawValue;
}

function mapRow(row: Record<string, unknown>): HomePageTranslation {
  return {
    pageKey: 'home',
    localeCode: row.locale_code as SupportedLocale,
    title: row.title as string,
    subtitle: row.subtitle as string,
    philosophy: row.philosophy as string,
    viewMenuText: row.view_menu_text as string,
    reserveTableText: row.reserve_table_text as string,
    homeSeoHeading: row.home_seo_heading as string,
    homeSeoParagraphOne: row.home_seo_paragraph_one as string,
    homeSeoParagraphTwo: row.home_seo_paragraph_two as string,
    p3BeforeMenuLink: row.p3_before_menu_link as string,
    p3MenuLinkText: row.p3_menu_link_text as string,
    p3BetweenLinks: row.p3_between_links as string,
    p3ReserveLinkText: row.p3_reserve_link_text as string,
    p3AfterReserveLink: row.p3_after_reserve_link as string,
    essenceTitleHtml: row.essence_title_html as string,
    essenceDescription: row.essence_description as string,
    essenceCtaText: row.essence_cta_text as string,
    essenceCtaLink: row.essence_cta_link as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function parseHomeTranslationInput(body: unknown): HomeTranslationInput {
  const record = asTextRecord(body);

  return {
    title: asString(record, 'title'),
    subtitle: asString(record, 'subtitle'),
    philosophy: asString(record, 'philosophy'),
    viewMenuText: asString(record, 'viewMenuText'),
    reserveTableText: asString(record, 'reserveTableText'),
    homeSeoHeading: asString(record, 'homeSeoHeading'),
    homeSeoParagraphOne: asString(record, 'homeSeoParagraphOne'),
    homeSeoParagraphTwo: asString(record, 'homeSeoParagraphTwo'),
    p3BeforeMenuLink: asString(record, 'p3BeforeMenuLink'),
    p3MenuLinkText: asString(record, 'p3MenuLinkText'),
    p3BetweenLinks: asString(record, 'p3BetweenLinks'),
    p3ReserveLinkText: asString(record, 'p3ReserveLinkText'),
    p3AfterReserveLink: asString(record, 'p3AfterReserveLink'),
    essenceTitleHtml: asString(record, 'essenceTitleHtml'),
    essenceDescription: asString(record, 'essenceDescription'),
    essenceCtaText: asString(record, 'essenceCtaText'),
    essenceCtaLink: asString(record, 'essenceCtaLink'),
  };
}

export async function listHomeTranslations(): Promise<HomeTranslationSummary[]> {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `
      SELECT page_key, locale_code, title, subtitle, updated_at
      FROM home_page_translation
      WHERE page_key = $1
      ORDER BY locale_code ASC
    `,
    [PAGE_KEY],
  );

  return rows.map((row) => ({
    pageKey: 'home',
    localeCode: row.locale_code as SupportedLocale,
    title: row.title as string,
    subtitle: row.subtitle as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  }));
}

export async function getHomeTranslation(locale: SupportedLocale): Promise<HomePageTranslation | null> {
  const pool = getDbPool();
  const { rows } = await pool.query(`${HOME_SELECT_SQL} WHERE page_key = $1 AND locale_code = $2 LIMIT 1`, [PAGE_KEY, locale]);

  if (!rows[0]) return null;
  return mapRow(rows[0]);
}

export async function updateHomeTranslation(locale: SupportedLocale, payload: HomeTranslationInput): Promise<HomePageTranslation | null> {
  const pool = getDbPool();

  const { rows } = await pool.query(
    `
      UPDATE home_page_translation
      SET
        title = $3,
        subtitle = $4,
        philosophy = $5,
        view_menu_text = $6,
        reserve_table_text = $7,
        home_seo_heading = $8,
        home_seo_paragraph_one = $9,
        home_seo_paragraph_two = $10,
        p3_before_menu_link = $11,
        p3_menu_link_text = $12,
        p3_between_links = $13,
        p3_reserve_link_text = $14,
        p3_after_reserve_link = $15,
        essence_title_html = $16,
        essence_description = $17,
        essence_cta_text = $18,
        essence_cta_link = $19
      WHERE page_key = $1 AND locale_code = $2
      RETURNING
        page_key,
        locale_code,
        title,
        subtitle,
        philosophy,
        view_menu_text,
        reserve_table_text,
        home_seo_heading,
        home_seo_paragraph_one,
        home_seo_paragraph_two,
        p3_before_menu_link,
        p3_menu_link_text,
        p3_between_links,
        p3_reserve_link_text,
        p3_after_reserve_link,
        essence_title_html,
        essence_description,
        essence_cta_text,
        essence_cta_link,
        updated_at
    `,
    [
      PAGE_KEY,
      locale,
      payload.title,
      payload.subtitle,
      payload.philosophy,
      payload.viewMenuText,
      payload.reserveTableText,
      payload.homeSeoHeading,
      payload.homeSeoParagraphOne,
      payload.homeSeoParagraphTwo,
      payload.p3BeforeMenuLink,
      payload.p3MenuLinkText,
      payload.p3BetweenLinks,
      payload.p3ReserveLinkText,
      payload.p3AfterReserveLink,
      payload.essenceTitleHtml,
      payload.essenceDescription,
      payload.essenceCtaText,
      payload.essenceCtaLink,
    ],
  );

  if (!rows[0]) return null;
  return mapRow(rows[0]);
}

