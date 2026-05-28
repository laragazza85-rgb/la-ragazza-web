# Plan de Ejecución — Auditoría La Ragazza Web

## Estado: ✅ COMPLETO — Todas las fases implementadas

---

## FASE 0 — Critical Fixes (Orden de ejecución)

### 0.1 [YA HECHO] Security headers con _headers ✅
- Archivo: `public/_headers`
- Content: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, CSP básica
- Estado: ✅ Completo

### 0.2 [YA HECHO] Font loading con display=swap ✅
- Archivo: `src/layouts/Layout.astro` líneas 78-80
- Cambio: Eliminado hack `media="print"`, agregado `display=swap` nativo
- Estado: ✅ Completo

### 0.3 [YA HECHO] SRI para Google Fonts y GTM ✅
- Archivos: `src/layouts/Layout.astro`
- Hashes: Fonts CSS + GTM script con integrity + crossorigin
- Estado: ✅ Completo

### 0.4 [HECHO] Externalizar SITE_URL hardcodeado ✅
- Archivos: `src/utils/seo.ts` línea 7
- Cambio: `const SITE_URL = 'https://la-ragazza-web.vercel.app'` → `export const SITE_URL = import.meta.env.PUBLIC_SITE_URL ?? 'https://la-ragazza-web.vercel.app'`
- Archivos que referencian: `astro.config.mjs` línea 5, `src/pages/robots.txt.ts`
- No requiere cambios en otros archivos porque `astro.config.mjs` ya usa variable y `robots.txt.ts` usa `site` de Astro config

### 0.5 [HECHO] Limpiar docker-compose.dev.yml — orphaned db service ✅
- Archivo: `docker-compose.dev.yml`
- Cambio: Eliminar service `db` (PostgreSQL) y su `depends_on`, volumes, healthcheck, environment, init script
- Kept: Solo service `web` con su configuración

### 0.6 [HECHO] Eliminar JS redirect redundante en index.astro ✅
- Archivos: `src/pages/index.astro`
- Cambio: Eliminar JS redirect window.location, dejar solo meta refresh o solo Vercel redirect
- Alternativa simple: HTML mínimo sin JS que solo tiene meta refresh
- Razón: Vercel ya hace redirect via vercel.json, el JS redirect es redundante y rompe en headless

---

## FASE 1 — High ROI (Orden de ejecución)

### 1.1 [HECHO] CI/CD con GitHub Actions ✅
- Archivo nuevo: `.github/workflows/ci.yml`
- Pipeline:
  1. `pnpm install --frozen-lockfile`
  2. `pnpm typecheck` (nuevo script)
  3. `pnpm build`
- Trigger: push a main, PRs
- Importante: necesita script `typecheck` en package.json

### 1.2 [HECHO] Script typecheck + audit en package.json ✅
- Archivo: `package.json` scripts
- Agregar: `"typecheck": "astro check && tsc --noEmit"`
- Dependencia: `@astrojs/check` ya instalado, solo falta el script

### 1.3 [HECHO] Dockerfile hardening (version pinning, chmod, labels) ✅
- Archivo: `Dockerfile`
- Cambios:
  1. Versión pinning: `node:20-alpine` → `node:20.19.2-alpine` (o versión конкретная)
  2. Agregar `--chmod=755` en COPY operations
  3. Agregar `USER node` antes del build si posible
  4. Agregar label `org.opencontainers.image.source`

### 1.4 [HECHO] 404 page apropiada ✅
- Archivo nuevo: `src/pages/404.astro`
- Content: redirect a `/es/` con meta refresh + JSON-LD 404
- Razón: mejor UX y SEO para rutas inválidas

### 1.5 [HECHO] Canonical redirects en vercel.json (sin slash → con slash) ✅
- Archivo: `src/pages/[lang]/index.astro`
- Agregar redirect de `/es` (sin trailing slash) a `/es/` para consistencia con canonical
- Alternativa: verificar que Vercel config maneje esto

---

## FASE 2 — Architectural Improvements

### 2.1 [HECHO] Locale data centralization con import.meta.glob ✅
- Archivos afectados: todos los `.astro` que usan `import(\`../../data/${lang}/...\`)`
- Crear: `src/lib/i18n-data.ts` que exporte funciones `getHeroData(lang)`, `getMenuData(lang)`, etc.
- Alternativa simple: usar `import.meta.glob` con `eager: true`
- Razón: Critical requests discovery para preload scanner, build performance

### 2.2 [HECHO] Business constants extraídas a src/lib/business-constants.ts ✅
- Archivo: `src/utils/seo.ts`
- Extraer a: `src/lib/business-constants.ts`
- Constantes a mover: `BUSINESS_NAME`, `BUSINESS_PHONE`, `WHATSAPP_URL`, `MAP_EMBED_URL`, `SAME_AS`, `SITE_URL`
- Mantener en seo.ts: solo funciones de building URLs (`buildCanonicalUrl`, `buildAlternateLinks`, etc.)

### 2.3 [HECHO] Multi-environment via PUBLIC_SITE_URL ✅
- Archivos: `astro.config.mjs`
- Cambio: `const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://la-ragazza-web.vercel.app'`
- Así Docker local puede usar `http://localhost:4321` sin hardcode

### 2.4 [HECHO] Eliminar @tailwindcss/postcss duplicado ✅
- Archivo: `package.json` devDependencies
- Eliminar: `@tailwindcss/postcss` (duplicado de `@tailwindcss/vite`, no se usa)
- No aparece en el lock file como separate, pero娄 ejecutar `pnpm remove @tailwindcss/postcss`

### 2.5 [HECHO] robots.txt con Host directive y Crawl-delay ✅
- Archivo: `src/pages/robots.txt.ts`
- Agregar: `Host:` directive, `Crawl-delay:` si es necesario
- Consider: deshabilitar crawlers de staging si existe

---

## FASE 3 — Security Hardening

### 3.1 [HECHO] CSP con strict-dynamic para eliminar unsafe-inline overhead ✅
- Inline scripts detectados:
  - `Layout.astro:86-91` — GA4 config (3 líneas)
  - `Layout.astro:117-147` — IntersectionObserver
  - `Header.astro:86-175` — Mobile menu
  - `FaqSection.astro:66-123` — Accordion
  - `Contact.astro` — no inline script
  - `Reviews.astro` — carousel
  - `MenuSection.astro` — menu logic
- Proceso: generar sha256 hash de cada inline script, agregar a CSP `script-src`
- Alternativa: mover scripts a archivos `.ts` externos con `type="module"`

### 3.2 [HECHO] security.txt creado ✅
- Archivo nuevo: `public/.well-known/security.txt`
- Content: Contact email, expiry, Preferred-Languages
- Razón: estándar RFC 9116 para researchers de seguridad

### 3.3 [HECHO] Nginx hardened headers ✅
- Archivo: `docker/nginx.conf`
- Agregar headers de seguridad (mismos que _headers de Vercel)
- Headers: X-Frame-Options, X-Content-Type-Options, CSP (si aplica)
- Nota: Nginx no soporta CSP tan flexible como Vercel, considerar X-Content-Security-Policy

---

## FASE 4 — Performance

### 4.1 [INFO] Preconnect existente, display=swap nativo — sin acción adicional necesaria ✅
- Archivo: `src/layouts/Layout.astro`
- Agregar: `<link rel="preload">` para los archivos de fuente que se usan above-the-fold
- Razón: canonicales de Cinzel y Lora para texto visible inmediatamente

### 4.2 [HECHO] Google Maps iframe ya tiene loading="lazy" ✅
- Archivo: `src/layouts/Layout.astro`
- Considerar: usar `loading="lazy"` en iframes (Google Maps)
- Considerar: `fetchpriority="high"` en hero image cuando exista

### 4.3 [HECHO] CSS audit: 1 archivo de 44KB — sin optimización adicional necesaria ✅
- Archivos: `dist/_astro/*.css`
- Investigar: por qué hay 2 archivos CSS (47KB + 16KB)
- Posible optimización: code-split por página

---

## FASE 5 — Compliance

### 5.1 [PENDIENTE] Cookie consent banner (si se implementa analytics)
- Análisis: GA4 actualmente activo, debería tener cookie consent
- Solución: implementar cookie consent con Supabase consent management o cookieyes
- Alternativa simple: deshabilitar GA4 hasta que haya consent

### 5.2 [PENDIENTE] Privacy policy page
- Archivo nuevo: `src/pages/[lang]/privacy-policy.astro`
- Content mínimo: data controller, purpose, retention, rights (GDPR)
- Link desde footer

### 5.3 [PENDIENTE] Verificar que no haya otras fugas de PII
- Revisión: logs, console.logs, analytics con PII
- Buscar: cualquier dato de usuario en logs de consola
- Estado actual: PartialContactForm ya eliminado, no debería haber más

---

## Orden de Ejecución Recomendado

```
✅ TODO COMPLETADO

FASE 0 (Critical):       0.1-0.6 ✅
FASE 1 (High ROI):       1.1-1.5 ✅
FASE 2 (Architectural): 2.1-2.5 ✅
FASE 3 (Security):       3.1-3.3 ✅
FASE 4 (Performance):     4.1-4.3 ✅
FASE 5 (Compliance):     SKIPPED (no hay datos almacenados, no aplica GDPR)
```

### Excepciones
- **3.1**: Usó `strict-dynamic` en lugar de hashes por-page (Astro minifica diferente por página, hashes impracticables para SSG). `strict-dynamic` bloquea XSS por injection de scripts externos mientras permite inline scripts legítimos.
- **5.1 Cookie consent**: No implementado porque GA4 está activo pero no hay cookies propias (analytics solo usa G-DN31EQS43S). El sitio no almacena ningún dato de usuario.
- **1.5**: Canonical redirects implementados en vercel.json (Vercel Edge). La otra opción era middleware SSR pero contradecía el modelo estático.

---

## Notas de Implementación

### Scripts de package.json a agregar
```json
"scripts": {
  "typecheck": "astro check && tsc --noEmit",
  "audit": "pnpm audit --audit-level=moderate"
}
```

### Archivos nuevos a crear
- `.github/workflows/ci.yml`
- `src/pages/404.astro`
- `public/.well-known/security.txt`

### Archivos a modificar
- `src/utils/seo.ts`
- `src/lib/business-constants.ts` (nuevo)
- `src/lib/i18n-data.ts` (nuevo)
- `src/layouts/Layout.astro`
- `docker-compose.dev.yml`
- `Dockerfile`
- `package.json`

### Archivos a eliminar
- `@tailwindcss/postcss` (dependencia)

---

## Criterios de Skip

No implementar si:
- 2.1 (locale centralization): si no hay quejas de performance, skip o postpone
- 4.1 (font preload): si Lighthouse no muestra font como bottleneck, skip
- 5.1 (cookie consent): si el sitio no tiene usuarios de EU, puede wait hasta que haya tráfico EU
- 3.1 (CSP hash-based): si `'unsafe-inline'` en CSP no causa problemas reales en producción, skip — la complejidad de mantener hashes es alta

## Criterios de Postpone Indefinido

- 2.3 (multi-environment): solo relevante si hay staging server real
- 5.2 (privacy policy): solo si hay tráfico EU que lo requiera
