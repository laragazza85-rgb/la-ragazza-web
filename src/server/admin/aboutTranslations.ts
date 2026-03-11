import { getDbPool } from '../db/client';
import { type SupportedLocale, parseLocale } from './homePageTranslations';

const PAGE_KEY = 'about';

export type AboutSummary = {
  pageKey: 'about';
  localeCode: SupportedLocale;
  headerTitle: string;
  philosophyTitle: string;
  updatedAt: string;
};

export type AboutPageTranslation = {
  pageKey: 'about';
  localeCode: SupportedLocale;
  headerLabel: string;
  headerTitle: string;
  philosophyTitle: string;
  philosophyDescription: string;
  philosophyPromise: string;
  updatedAt: string;
};

export type AboutPersonParagraph = {
  paragraphOrder: number;
  paragraphText: string;
};

export type AboutPerson = {
  personKey: string;
  sortOrder: number;
  label: string;
  personName: string;
  mediaPlaceholder: string;
  paragraphs: AboutPersonParagraph[];
};

export type AboutTranslationDetail = {
  page: AboutPageTranslation;
  people: AboutPerson[];
};

export type AboutPageTranslationInput = Omit<AboutPageTranslation, 'pageKey' | 'localeCode' | 'updatedAt'>;

export type AboutPersonInput = {
  personKey: string;
  label: string;
  personName: string;
  mediaPlaceholder: string;
  paragraphs: AboutPersonParagraph[];
};

export type AboutTranslationInput = {
  page: AboutPageTranslationInput;
  people: AboutPersonInput[];
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

  if (typeof rawValue !== 'number' || Number.isNaN(rawValue)) {
    throw new Error(`Field ${key} must be a number`);
  }

  return rawValue;
}

function asArray(record: Record<string, unknown>, key: string): unknown[] {
  const rawValue = record[key];

  if (!Array.isArray(rawValue)) {
    throw new Error(`Field ${key} must be an array`);
  }

  return rawValue;
}

function mapPageRow(row: Record<string, unknown>): AboutPageTranslation {
  return {
    pageKey: 'about',
    localeCode: row.locale_code as SupportedLocale,
    headerLabel: row.header_label as string,
    headerTitle: row.header_title as string,
    philosophyTitle: row.philosophy_title as string,
    philosophyDescription: row.philosophy_description as string,
    philosophyPromise: row.philosophy_promise as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

export function parseAboutTranslationInput(body: unknown): AboutTranslationInput {
  const root = asTextRecord(body);
  const pageRecord = asTextRecord(root.page);
  const peopleRaw = asArray(root, 'people');

  const people = peopleRaw.map((personRaw, personIndex) => {
    const personRecord = asTextRecord(personRaw);
    const paragraphsRaw = asArray(personRecord, 'paragraphs');

    const paragraphs = paragraphsRaw.map((paragraphRaw) => {
      const paragraphRecord = asTextRecord(paragraphRaw);

      return {
        paragraphOrder: asNumber(paragraphRecord, 'paragraphOrder'),
        paragraphText: asString(paragraphRecord, 'paragraphText'),
      };
    });

    if (paragraphs.length === 0) {
      throw new Error(`people[${personIndex}].paragraphs must have at least one paragraph`);
    }

    return {
      personKey: asString(personRecord, 'personKey'),
      label: asString(personRecord, 'label'),
      personName: asString(personRecord, 'personName'),
      mediaPlaceholder: asString(personRecord, 'mediaPlaceholder'),
      paragraphs,
    };
  });

  if (people.length === 0) {
    throw new Error('people must have at least one person');
  }

  return {
    page: {
      headerLabel: asString(pageRecord, 'headerLabel'),
      headerTitle: asString(pageRecord, 'headerTitle'),
      philosophyTitle: asString(pageRecord, 'philosophyTitle'),
      philosophyDescription: asString(pageRecord, 'philosophyDescription'),
      philosophyPromise: asString(pageRecord, 'philosophyPromise'),
    },
    people,
  };
}

export async function listAboutTranslations(): Promise<AboutSummary[]> {
  const pool = getDbPool();
  const { rows } = await pool.query(
    `
      SELECT page_key, locale_code, header_title, philosophy_title, updated_at
      FROM about_page_translation
      WHERE page_key = $1
      ORDER BY locale_code ASC
    `,
    [PAGE_KEY],
  );

  return rows.map((row) => ({
    pageKey: 'about',
    localeCode: row.locale_code as SupportedLocale,
    headerTitle: row.header_title as string,
    philosophyTitle: row.philosophy_title as string,
    updatedAt: (row.updated_at as Date).toISOString(),
  }));
}

export async function getAboutTranslation(locale: string): Promise<AboutTranslationDetail | null> {
  const parsedLocale = parseLocale(locale);
  const pool = getDbPool();

  const pageResponse = await pool.query(
    `
      SELECT
        page_key,
        locale_code,
        header_label,
        header_title,
        philosophy_title,
        philosophy_description,
        philosophy_promise,
        updated_at
      FROM about_page_translation
      WHERE page_key = $1 AND locale_code = $2
      LIMIT 1
    `,
    [PAGE_KEY, parsedLocale],
  );

  if (!pageResponse.rows[0]) {
    return null;
  }

  const peopleResponse = await pool.query(
    `
      SELECT
        p.person_key,
        p.sort_order,
        pt.label,
        pt.person_name,
        pt.media_placeholder,
        pp.paragraph_order,
        ppt.paragraph_text
      FROM about_person p
      JOIN about_person_translation pt
        ON pt.person_key = p.person_key
      JOIN about_person_paragraph pp
        ON pp.person_key = p.person_key
      JOIN about_person_paragraph_translation ppt
        ON ppt.person_key = pp.person_key
       AND ppt.paragraph_order = pp.paragraph_order
      WHERE p.page_key = $1
        AND pt.locale_code = $2
        AND ppt.locale_code = $2
      ORDER BY p.sort_order ASC, pp.paragraph_order ASC
    `,
    [PAGE_KEY, parsedLocale],
  );

  const peopleByKey = new Map<string, AboutPerson>();

  for (const row of peopleResponse.rows) {
    const key = row.person_key as string;

    if (!peopleByKey.has(key)) {
      peopleByKey.set(key, {
        personKey: key,
        sortOrder: row.sort_order as number,
        label: row.label as string,
        personName: row.person_name as string,
        mediaPlaceholder: row.media_placeholder as string,
        paragraphs: [],
      });
    }

    peopleByKey.get(key)?.paragraphs.push({
      paragraphOrder: row.paragraph_order as number,
      paragraphText: row.paragraph_text as string,
    });
  }

  return {
    page: mapPageRow(pageResponse.rows[0]),
    people: Array.from(peopleByKey.values()),
  };
}

export async function updateAboutTranslation(locale: string, payload: AboutTranslationInput): Promise<AboutTranslationDetail | null> {
  const parsedLocale = parseLocale(locale);
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pageUpdate = await client.query(
      `
        UPDATE about_page_translation
        SET
          header_label = $3,
          header_title = $4,
          philosophy_title = $5,
          philosophy_description = $6,
          philosophy_promise = $7
        WHERE page_key = $1 AND locale_code = $2
      `,
      [
        PAGE_KEY,
        parsedLocale,
        payload.page.headerLabel,
        payload.page.headerTitle,
        payload.page.philosophyTitle,
        payload.page.philosophyDescription,
        payload.page.philosophyPromise,
      ],
    );

    if (pageUpdate.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    for (const person of payload.people) {
      const personUpdate = await client.query(
        `
          UPDATE about_person_translation
          SET
            label = $3,
            person_name = $4,
            media_placeholder = $5
          WHERE person_key = $1 AND locale_code = $2
        `,
        [person.personKey, parsedLocale, person.label, person.personName, person.mediaPlaceholder],
      );

      if (personUpdate.rowCount === 0) {
        throw new Error(`Person translation not found for ${person.personKey}`);
      }

      for (const paragraph of person.paragraphs) {
        const paragraphUpdate = await client.query(
          `
            UPDATE about_person_paragraph_translation
            SET paragraph_text = $4
            WHERE person_key = $1 AND paragraph_order = $2 AND locale_code = $3
          `,
          [person.personKey, paragraph.paragraphOrder, parsedLocale, paragraph.paragraphText],
        );

        if (paragraphUpdate.rowCount === 0) {
          throw new Error(
            `Paragraph translation not found for ${person.personKey} paragraph ${paragraph.paragraphOrder}`,
          );
        }
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return getAboutTranslation(parsedLocale);
}
