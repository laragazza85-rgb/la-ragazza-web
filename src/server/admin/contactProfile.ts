import { getDbPool } from '../db/client';
import { type SupportedLocale, parseLocale } from './homePageTranslations';

const PROFILE_KEY = 'main';

export type ContactProfile = {
  profileKey: 'main';
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  mapLink: string;
  wazeLink: string;
  mapEmbedUrl: string;
  latitude: number;
  longitude: number;
  whatsappPhoneNumber: string;
  whatsappMessage: string;
  updatedAt: string;
};

export type ContactTranslation = {
  profileKey: 'main';
  localeCode: SupportedLocale;
  locationLabel: string;
  familyTitle: string;
  familyFounded: string;
  familyOwners: string;
  familyPhilosophy: string;
  familyCta: string;
  whatsappLabel: string;
  whatsappDescription: string;
  uiTitle: string;
  mapTitle: string;
  mapGoogle: string;
  mapWaze: string;
  mapIframeTitle: string;
  mapOpenAria: string;
  aboutAria: string;
  socialInstagramAria: string;
  socialFacebookAria: string;
  updatedAt: string;
};

export type ContactSummary = {
  profileKey: 'main';
  localeCode: SupportedLocale;
  uiTitle: string;
  locationLabel: string;
  streetAddress: string;
  whatsappPhoneNumber: string;
  updatedAt: string;
};

export type ContactDetail = {
  profile: ContactProfile;
  translation: ContactTranslation;
};

export type ContactProfileInput = Omit<ContactProfile, 'profileKey' | 'updatedAt'>;
export type ContactTranslationInput = Omit<ContactTranslation, 'profileKey' | 'localeCode' | 'updatedAt'>;

export type ContactDetailInput = {
  profile: ContactProfileInput;
  translation: ContactTranslationInput;
};

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

function asNumber(record: Record<string, unknown>, key: string): number {
  const rawValue = record[key];

  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error(`Field ${key} must be a number`);
}

function mapProfileRow(row: Record<string, unknown>): ContactProfile {
  return {
    profileKey: 'main',
    streetAddress: row.street_address as string,
    city: row.city as string,
    state: row.state as string,
    country: row.country as string,
    mapLink: row.map_link as string,
    wazeLink: row.waze_link as string,
    mapEmbedUrl: row.map_embed_url as string,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    whatsappPhoneNumber: row.whatsapp_phone_number as string,
    whatsappMessage: row.whatsapp_message as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function mapTranslationRow(row: Record<string, unknown>): ContactTranslation {
  return {
    profileKey: 'main',
    localeCode: row.locale_code as SupportedLocale,
    locationLabel: row.location_label as string,
    familyTitle: row.family_title as string,
    familyFounded: row.family_founded as string,
    familyOwners: row.family_owners as string,
    familyPhilosophy: row.family_philosophy as string,
    familyCta: row.family_cta as string,
    whatsappLabel: row.whatsapp_label as string,
    whatsappDescription: row.whatsapp_description as string,
    uiTitle: row.ui_title as string,
    mapTitle: row.map_title as string,
    mapGoogle: row.map_google as string,
    mapWaze: row.map_waze as string,
    mapIframeTitle: row.map_iframe_title as string,
    mapOpenAria: row.map_open_aria as string,
    aboutAria: row.about_aria as string,
    socialInstagramAria: row.social_instagram_aria as string,
    socialFacebookAria: row.social_facebook_aria as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function parseContactDetailInput(body: unknown): ContactDetailInput {
  const root = asTextRecord(body);
  const profile = asTextRecord(root.profile);
  const translation = asTextRecord(root.translation);

  return {
    profile: {
      streetAddress: asString(profile, 'streetAddress'),
      city: asString(profile, 'city'),
      state: asString(profile, 'state'),
      country: asString(profile, 'country'),
      mapLink: asString(profile, 'mapLink'),
      wazeLink: asString(profile, 'wazeLink'),
      mapEmbedUrl: asString(profile, 'mapEmbedUrl'),
      latitude: asNumber(profile, 'latitude'),
      longitude: asNumber(profile, 'longitude'),
      whatsappPhoneNumber: asString(profile, 'whatsappPhoneNumber'),
      whatsappMessage: asString(profile, 'whatsappMessage'),
    },
    translation: {
      locationLabel: asString(translation, 'locationLabel'),
      familyTitle: asString(translation, 'familyTitle'),
      familyFounded: asString(translation, 'familyFounded'),
      familyOwners: asString(translation, 'familyOwners'),
      familyPhilosophy: asString(translation, 'familyPhilosophy'),
      familyCta: asString(translation, 'familyCta'),
      whatsappLabel: asString(translation, 'whatsappLabel'),
      whatsappDescription: asString(translation, 'whatsappDescription'),
      uiTitle: asString(translation, 'uiTitle'),
      mapTitle: asString(translation, 'mapTitle'),
      mapGoogle: asString(translation, 'mapGoogle'),
      mapWaze: asString(translation, 'mapWaze'),
      mapIframeTitle: asString(translation, 'mapIframeTitle'),
      mapOpenAria: asString(translation, 'mapOpenAria'),
      aboutAria: asString(translation, 'aboutAria'),
      socialInstagramAria: asString(translation, 'socialInstagramAria'),
      socialFacebookAria: asString(translation, 'socialFacebookAria'),
    },
  };
}

export async function listContactTranslations(): Promise<ContactSummary[]> {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `
      SELECT
        c.profile_key,
        t.locale_code,
        t.ui_title,
        t.location_label,
        c.street_address,
        c.whatsapp_phone_number,
        t.updated_at
      FROM contact_profile c
      JOIN contact_profile_translation t
        ON t.profile_key = c.profile_key
      WHERE c.profile_key = $1
      ORDER BY t.locale_code ASC
    `,
    [PROFILE_KEY],
  );

  return rows.map((row) => ({
    profileKey: 'main',
    localeCode: row.locale_code as SupportedLocale,
    uiTitle: row.ui_title as string,
    locationLabel: row.location_label as string,
    streetAddress: row.street_address as string,
    whatsappPhoneNumber: row.whatsapp_phone_number as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  }));
}

export async function getContactDetail(locale: string): Promise<ContactDetail | null> {
  const parsedLocale = parseLocale(locale);
  const pool = getDbPool();

  const profileResponse = await pool.query(
    `
      SELECT
        profile_key,
        street_address,
        city,
        state,
        country,
        map_link,
        waze_link,
        map_embed_url,
        latitude,
        longitude,
        whatsapp_phone_number,
        whatsapp_message,
        updated_at
      FROM contact_profile
      WHERE profile_key = $1
      LIMIT 1
    `,
    [PROFILE_KEY],
  );

  const translationResponse = await pool.query(
    `
      SELECT
        profile_key,
        locale_code,
        location_label,
        family_title,
        family_founded,
        family_owners,
        family_philosophy,
        family_cta,
        whatsapp_label,
        whatsapp_description,
        ui_title,
        map_title,
        map_google,
        map_waze,
        map_iframe_title,
        map_open_aria,
        about_aria,
        social_instagram_aria,
        social_facebook_aria,
        updated_at
      FROM contact_profile_translation
      WHERE profile_key = $1 AND locale_code = $2
      LIMIT 1
    `,
    [PROFILE_KEY, parsedLocale],
  );

  if (!profileResponse.rows[0] || !translationResponse.rows[0]) {
    return null;
  }

  return {
    profile: mapProfileRow(profileResponse.rows[0]),
    translation: mapTranslationRow(translationResponse.rows[0]),
  };
}

export async function updateContactDetail(locale: string, payload: ContactDetailInput): Promise<ContactDetail | null> {
  const parsedLocale = parseLocale(locale);
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const profileUpdate = await client.query(
      `
        UPDATE contact_profile
        SET
          street_address = $2,
          city = $3,
          state = $4,
          country = $5,
          map_link = $6,
          waze_link = $7,
          map_embed_url = $8,
          latitude = $9,
          longitude = $10,
          whatsapp_phone_number = $11,
          whatsapp_message = $12
        WHERE profile_key = $1
      `,
      [
        PROFILE_KEY,
        payload.profile.streetAddress,
        payload.profile.city,
        payload.profile.state,
        payload.profile.country,
        payload.profile.mapLink,
        payload.profile.wazeLink,
        payload.profile.mapEmbedUrl,
        payload.profile.latitude,
        payload.profile.longitude,
        payload.profile.whatsappPhoneNumber,
        payload.profile.whatsappMessage,
      ],
    );

    const translationUpdate = await client.query(
      `
        UPDATE contact_profile_translation
        SET
          location_label = $3,
          family_title = $4,
          family_founded = $5,
          family_owners = $6,
          family_philosophy = $7,
          family_cta = $8,
          whatsapp_label = $9,
          whatsapp_description = $10,
          ui_title = $11,
          map_title = $12,
          map_google = $13,
          map_waze = $14,
          map_iframe_title = $15,
          map_open_aria = $16,
          about_aria = $17,
          social_instagram_aria = $18,
          social_facebook_aria = $19
        WHERE profile_key = $1 AND locale_code = $2
      `,
      [
        PROFILE_KEY,
        parsedLocale,
        payload.translation.locationLabel,
        payload.translation.familyTitle,
        payload.translation.familyFounded,
        payload.translation.familyOwners,
        payload.translation.familyPhilosophy,
        payload.translation.familyCta,
        payload.translation.whatsappLabel,
        payload.translation.whatsappDescription,
        payload.translation.uiTitle,
        payload.translation.mapTitle,
        payload.translation.mapGoogle,
        payload.translation.mapWaze,
        payload.translation.mapIframeTitle,
        payload.translation.mapOpenAria,
        payload.translation.aboutAria,
        payload.translation.socialInstagramAria,
        payload.translation.socialFacebookAria,
      ],
    );

    if (profileUpdate.rowCount === 0 || translationUpdate.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getContactDetail(parsedLocale);
}

