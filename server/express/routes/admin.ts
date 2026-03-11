import { Router, type Request, type Response } from 'express';
import { getAdminHealth } from '../../../src/server/admin/health';
import {
  getAboutTranslation,
  listAboutTranslations,
  parseAboutTranslationInput,
  updateAboutTranslation,
} from '../../../src/server/admin/aboutTranslations';
import {
  getHomeTranslation,
  listHomeTranslations,
  parseHomeTranslationInput,
  parseLocale,
  updateHomeTranslation,
} from '../../../src/server/admin/homePageTranslations';

function getParamAsString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export const adminRouter = Router();

adminRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'express-admin-api', timestamp: new Date().toISOString() });
});

adminRouter.get('/db-health', async (_req: Request, res: Response) => {
  const health = await getAdminHealth();
  res.status(health.ok ? 200 : 503).json(health);
});

adminRouter.get('/home-translations', async (_req: Request, res: Response) => {
  try {
    const rows = await listHomeTranslations();
    res.status(200).json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' });
  }
});

adminRouter.get('/home-translations/:locale', async (req: Request, res: Response) => {
  try {
    const locale = parseLocale(getParamAsString(req.params.locale));
    const row = await getHomeTranslation(locale);

    if (!row) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }

    res.status(200).json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(message.startsWith('Unsupported locale') ? 400 : 500).json({ ok: false, error: message });
  }
});

adminRouter.put('/home-translations/:locale', async (req: Request, res: Response) => {
  try {
    const locale = parseLocale(getParamAsString(req.params.locale));
    const payload = parseHomeTranslationInput(req.body);
    const row = await updateHomeTranslation(locale, payload);

    if (!row) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }

    res.status(200).json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const isBadRequest = message.startsWith('Unsupported locale') || message.startsWith('Field') || message === 'Invalid JSON payload';
    res.status(isBadRequest ? 400 : 500).json({ ok: false, error: message });
  }
});

adminRouter.get('/about-translations', async (_req: Request, res: Response) => {
  try {
    const rows = await listAboutTranslations();
    res.status(200).json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unexpected error' });
  }
});

adminRouter.get('/about-translations/:locale', async (req: Request, res: Response) => {
  try {
    const row = await getAboutTranslation(getParamAsString(req.params.locale));

    if (!row) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }

    res.status(200).json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(message.startsWith('Unsupported locale') ? 400 : 500).json({ ok: false, error: message });
  }
});

adminRouter.put('/about-translations/:locale', async (req: Request, res: Response) => {
  try {
    const payload = parseAboutTranslationInput(req.body);
    const row = await updateAboutTranslation(getParamAsString(req.params.locale), payload);

    if (!row) {
      res.status(404).json({ ok: false, error: 'Not found' });
      return;
    }

    res.status(200).json({ ok: true, data: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const isBadRequest =
      message.startsWith('Unsupported locale') ||
      message.startsWith('Field') ||
      message === 'Invalid JSON payload' ||
      message.includes('must have at least one');

    res.status(isBadRequest ? 400 : 500).json({ ok: false, error: message });
  }
});
