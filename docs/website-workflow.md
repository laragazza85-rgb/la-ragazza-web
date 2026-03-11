# Website Workflow — La Ragazza Web

Guía completa del flujo de trabajo del sitio web `la-ragazza-web`, desde que un usuario escribe la URL en el navegador hasta que ve una página renderizada, junto con los flujos de desarrollo, contenido, build y despliegue.

---

## Tabla de contenidos

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Flujo de una petición del usuario (runtime)](#2-flujo-de-una-petición-del-usuario-runtime)
3. [Flujo de idioma e i18n](#3-flujo-de-idioma-e-i18n)
4. [Flujo de datos por página](#4-flujo-de-datos-por-página)
5. [Flujo de componentes y layout](#5-flujo-de-componentes-y-layout)
6. [Flujo del formulario de entrega parcial](#6-flujo-del-formulario-de-entrega-parcial)
7. [Flujo de build (compilación)](#7-flujo-de-build-compilación)
8. [Flujo de despliegue (Vercel)](#8-flujo-de-despliegue-vercel)
9. [Flujo Docker (local/staging)](#9-flujo-docker-localstaging)
10. [Flujo de contenido (edición de datos)](#10-flujo-de-contenido-edición-de-datos)
11. [Flujo de reseñas (CSV → JSON)](#11-flujo-de-reseñas-csv--json)
12. [Flujo SEO](#12-flujo-seo)
13. [Flujo de estilos (Design System)](#13-flujo-de-estilos-design-system)
14. [Mapa de rutas completo](#14-mapa-de-rutas-completo)
15. [Mapa de dependencias entre archivos](#15-mapa-de-dependencias-entre-archivos)

---

## 1. Visión general del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO (Navegador)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP request
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL CDN / Edge Network                      │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐ │
│  │  vercel.json    │    │  middleware.ts (Edge Function)       │ │
│  │  / → /es/ (301) │    │  Accept-Language → /es/ o /en/ (307) │ │
│  └─────────────────┘    └──────────────────────────────────────┘ │
│                    Sirve archivos estáticos HTML/CSS/JS           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTML pre-generado
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ARCHIVOS ESTÁTICOS (dist/)                   │
│   Generados en build time por `astro build`                      │
│   /es/index.html, /en/menu/index.html, /es/gallery/index.html…  │
└─────────────────────────────────────────────────────────────────┘
```

El sitio es **100% estático**: no hay servidor de aplicación en producción. Todo el HTML se genera en tiempo de compilación (`pnpm build`) y se sirve como archivos planos desde la CDN de Vercel o desde Nginx (Docker).

---

## 2. Flujo de una petición del usuario (runtime)

### Caso 1: Usuario llega a `/`

```
Usuario: https://la-ragazza-web.vercel.app/
        │
        ▼
vercel.json detecta source "/"
        │
        ▼ 301 Permanent Redirect
        │
        ▼
/es/index.html servido desde CDN
        │
        ▼
Navegador renderiza la página Home en español
```

### Caso 2: Usuario llega con Accept-Language: en

```
Usuario: https://la-ragazza-web.vercel.app/
        │
        ▼
middleware.ts (Edge Function, corre antes del CDN)
Detecta header: Accept-Language: en-US
        │
        ▼ 307 Temporary Redirect + Cache-Control: no-store + Vary: Accept-Language
        │
        ▼
/en/index.html servido desde CDN
        │
        ▼
Navegador renderiza la página Home en inglés
```

### Caso 3: Usuario navega a `/es/menu`

```
Usuario: /es/menu
        │
        ▼
CDN sirve /es/menu/index.html directamente (no hay redirect)
        │
        ▼
HTML pre-generado con todo el contenido del menú en español
        │
        ▼
Navegador ejecuta JS de filtros de menú (solo interactividad cliente)
```

### Caso 4: URL no existente

```
Usuario: /es/inexistente
        │
        ▼
Nginx (Docker): devuelve 404
Vercel: devuelve página de error 404 por defecto de la plataforma
```

---

## 3. Flujo de idioma e i18n

El manejo de idioma opera en **tres capas independientes**:

```
Capa 1 — Edge (vercel.json)
  /  ──────────────────────→  /es/    (301 permanente, SEO-friendly)

Capa 2 — Edge Function (middleware.ts)
  /  + Accept-Language: en  → /en/   (307 temporal, no cacheado)
  /  + cualquier otro       → /es/   (307 temporal)

Capa 3 — Build time (Astro i18n config)
  src/pages/[lang]/index.astro  → genera /es/ y /en/
  src/pages/[lang]/about.astro  → genera /es/about y /en/about
  src/pages/[lang]/menu.astro   → genera /es/menu y /en/menu
  src/pages/[lang]/gallery.astro → genera /es/gallery y /en/gallery
  src/pages/[lang]/entrega-parcial-form.astro → genera /es/entrega-parcial-form y /en/entrega-parcial-form
```

### Cambio de idioma en navegación

```
Usuario está en /es/menu
        │
        ▼
Hace clic en LanguageSwitcher
        │
LanguageSwitcher.astro calcula:
  currentPath = Astro.url.pathname.replace(`/${lang}/`, '')  → "menu"
  targetPath  = `/${otherLang}/${currentPath}`              → "/en/menu"
        │
        ▼
Navegación directa a /en/menu
        │
        ▼
Vercel sirve /en/menu/index.html (pre-generado)
```

### Cómo se cargan las traducciones

```
src/i18n/ui.ts
  └─ Diccionario estático de traducciones es/en
  └─ Exporta `ui`, `defaultLang`, `languages`

src/i18n/utils.ts
  └─ getLangFromUrl(url)   → detecta idioma del pathname
  └─ useTranslations(lang) → devuelve función t(key)

Componentes usan:
  const t = useTranslations(lang)
  t('nav.home')  → 'Inicio' (es) o 'Home' (en)
```

---

## 4. Flujo de datos por página

Cada página carga su contenido desde archivos JSON locales **en tiempo de build**. No hay fetch en runtime.

### Home (`/[lang]/`)

```
src/pages/[lang]/index.astro
  ├─ import `src/data/[lang]/hero.json`
  │     → hero titles, essence section, editorial cards
  ├─ Layout.astro
  │     └─ import `src/data/[lang]/contact.json` (WhatsApp button)
  ├─ Hero.astro
  ├─ FaqSection.astro
  └─ Contact.astro
        └─ import `src/data/[lang]/contact.json`
```

### About (`/[lang]/about`)

```
src/pages/[lang]/about.astro
  ├─ import `src/data/[lang]/about.json`
  │     → header, philosophy, mauricio, carolina blocks
  ├─ Layout.astro
  ├─ Contact.astro
  └─ Footer.astro
```

### Menu (`/[lang]/menu`)

```
src/pages/[lang]/menu.astro
  ├─ import `src/data/[lang]/menu.json`
  │     → array de categorías → array de items con precio/descripción
  ├─ MenuSection.astro  (renderizado por categoría)
  │     └─ MenuCard.astro (renderizado por item)
  ├─ Filtros de categoría (JS cliente)
  ├─ Contact.astro
  └─ Footer.astro
```

### Gallery (`/[lang]/gallery`)

```
src/pages/[lang]/gallery.astro
  ├─ import `src/data/[lang]/gallery.json`
  │     → header + array de items (image/video)
  ├─ GalleryItem.astro (masonry layout)
  ├─ Reviews.astro
  │     └─ import `src/data/reviews/reviews.json`
  │           → array de reseñas con nombre/rating/texto
  ├─ Contact.astro
  └─ Footer.astro
```

### Entrega Parcial Form (`/[lang]/entrega-parcial-form`)

```
src/pages/[lang]/entrega-parcial-form.astro
  ├─ import `src/data/[lang]/partial-form.json`
  │     → labels, fields config, validation messages
  ├─ PartialContactForm.astro
  │     → formulario con validación 100% cliente (sin API)
  └─ Footer.astro
```

---

## 5. Flujo de componentes y layout

### Árbol de ensamblaje de una página

```
Layout.astro  (shell global)
  │
  ├─ <head>
  │    ├─ global.css (Tailwind v4 + design tokens)
  │    ├─ meta tags (SEO, OG, Twitter)
  │    ├─ hreflang alternates
  │    ├─ canonical URL
  │    ├─ JSON-LD Restaurant schema
  │    ├─ Google Fonts (Cinzel + Lora)
  │    └─ Google Analytics / GTM
  │
  ├─ <body>
  │    ├─ Header.astro
  │    │    ├─ Logo tipográfico (link a /[lang]/)
  │    │    ├─ Nav desktop (Home, About, Menu, Gallery)
  │    │    ├─ CTA "Reservar" (link a #contact)
  │    │    ├─ LanguageSwitcher.astro
  │    │    └─ Mobile menu (hamburger, JS inline)
  │    │
  │    ├─ <slot />  ← aquí entra el contenido de cada página
  │    │
  │    ├─ WhatsApp FAB (solo mobile, fijo en pantalla)
  │    └─ Reveal animation observer (JS inline)
  │
  └─ Footer.astro
       ├─ Logo + tagline familiar
       ├─ Nav footer (Home, Menu, About, Gallery)
       └─ Copyright con año dinámico
```

### Flujo del Header al hacer scroll

```
Usuario hace scroll  →  JS listener en Header
                         window.scrollY > 50?
                            sí → reduce altura en desktop (h-28 → h-24)
                            no → restaura altura original
```

### Flujo del menú mobile

```
Usuario toca botón hamburguesa
        │
        ▼
setMenuState(true)
  - mobile-menu: translate-y-full → translate-y-0  (slide down)
  - body: overflow → hidden (bloquea scroll de fondo)
  - ícono hamburguesa → ícono X

Usuario toca una ruta o el botón X
        │
        ▼
setMenuState(false)
  - mobile-menu: translate-y-0 → translate-y-full  (slide up)
  - body: overflow → ''  (restaura scroll)
  - ícono X → ícono hamburguesa
```

### Flujo de animaciones `.reveal`

```
Layout.astro monta IntersectionObserver
        │
        ▼
Cada elemento con clase `.reveal` comienza con:
  opacity-0 translate-y-8

Cuando el elemento entra al viewport (10% visible):
        │
        ▼
Observer callback ejecuta:
  requestAnimationFrame → elimina opacity-0 translate-y-8
                        → añade opacity-100 translate-y-0
  observer.unobserve(element)  (no repite)
```

---

## 6. Flujo del formulario de entrega parcial

Este formulario **no envía datos a ninguna API**. Valida localmente y muestra resultado.

```
Usuario abre /es/entrega-parcial-form
        │
        ▼
PartialContactForm.astro se renderiza con datos de partial-form.json
  - Labels en español (o inglés en /en/)
  - Mensajes de validación en el idioma correspondiente
        │
        ▼
Usuario llena los campos
        │
        ▼
Por cada tecla (evento input) → validateField()
  ┌─────────────────────────────────────────────────────┐
  │  fullName  → ¿valueMissing?  → "Campo obligatorio"  │
  │            → ¿menos de 2 palabras? → "Ingresa       │
  │              nombre y apellido"                       │
  │                                                       │
  │  email     → ¿valueMissing?  → "Campo obligatorio"  │
  │            → regex /^[^\s@]+@[^\s@]+\.com$/i         │
  │              → si falla → "Correo con @ y .com"      │
  │                                                       │
  │  phone     → ¿valueMissing?  → "Campo obligatorio"  │
  │            → regex /^\+[0-9]{1,4}[\s-]?[0-9]{6,14}/ │
  │              → si falla → "Empieza con +código"      │
  │                                                       │
  │  inquiryType → ¿valueMissing? → "Selecciona tipo"   │
  │                                                       │
  │  message   → ¿valueMissing?  → "Campo obligatorio"  │
  │            → ¿menos de 10 chars? → "Min 10 chars"   │
  └─────────────────────────────────────────────────────┘
        │
        ▼
Usuario hace clic en "Enviar formulario"
        │
        ▼
submit handler:
  1. normalizeFieldValue() en todos los campos
     - fullName: trim de bordes
     - email, phone: trim completo
  2. validateField() en todos los campos
  3. ¿Hay algún campo inválido?
     │
     ├─ SÍ → foco en primer campo inválido
     │        status: rojo "No se pudo enviar..."
     │
     └─ NO → captura payload en console.info()
              status: verde "Exitoso: recibimos tu información..."
              form.reset()
```

---

## 7. Flujo de build (compilación)

```bash
pnpm build
# internamente ejecuta: astro build
```

```
astro build
  │
  ├─ 1. Sync content (Astro content collections)
  │
  ├─ 2. Generate TypeScript types
  │
  ├─ 3. Build static entrypoints (Vite SSR)
  │    Compila todos los archivos .astro → JS/HTML
  │    Procesa Tailwind CSS v4 (via @tailwindcss/vite)
  │    Resuelve imports de JSON, componentes, utils
  │
  ├─ 4. Build client assets (Vite client)
  │    Genera CSS final, JS de interactividad (filtros, menú, etc.)
  │
  ├─ 5. Generate static routes
  │    getStaticPaths() por cada [lang] = ['es', 'en']
  │    Genera:
  │      /entrega-parcial-form/index.html
  │      /es/index.html
  │      /en/index.html
  │      /es/about/index.html
  │      /en/about/index.html
  │      /es/menu/index.html
  │      /en/menu/index.html
  │      /es/gallery/index.html
  │      /en/gallery/index.html
  │      /es/entrega-parcial-form/index.html
  │      /en/entrega-parcial-form/index.html
  │      /robots.txt
  │
  ├─ 6. @astrojs/sitemap genera sitemap-index.xml
  │
  └─ 7. Output completo en dist/
```

**Tiempo promedio de build:** ~2.5 segundos en hardware local.

---

## 8. Flujo de despliegue (Vercel)

```
Desarrollador hace push a rama principal (ej. main)
        │
        ▼
Vercel detecta nuevo commit
        │
        ▼
Vercel ejecuta:
  pnpm install --frozen-lockfile
  pnpm build   (astro build)
        │
        ▼
dist/ subido a la CDN global de Vercel
        │
        ▼
vercel.json aplicado:
  / → /es/ (301)
        │
        ▼
middleware.ts desplegado como Edge Function en todos los nodos CDN
        │
        ▼
Dominio activo: https://la-ragazza-web.vercel.app

Variable de entorno necesaria:
  PUBLIC_SITE_URL = https://la-ragazza-web.vercel.app
  (usada por astro.config.mjs y src/utils/seo.ts para URLs canónicas)
```

---

## 9. Flujo Docker (local/staging)

Hay dos modos: **desarrollo con hot reload** y **producción-like con Nginx**.

### Modo desarrollo (`make dev`)

```
make dev
  │
  ▼
docker-compose.dev.yml
  - Levanta contenedor con Node 20 + pnpm
  - Monta el código fuente como volumen (.:  /app:Z)
  - Ejecuta `pnpm dev` internamente
  - Expone puerto 4321
  │
  ▼
Código fuente en host es "reflejado" dentro del contenedor
Ediciones → Astro HMR → recarga automática en navegador
```

### Modo producción-like (`make prod-up`)

```
make prod-up
  │
  ▼
docker-compose.prod.yml
  │
  ▼
Dockerfile (multi-stage build):
  Etapa 1: deps
    node:20-alpine
    pnpm install --frozen-lockfile
    → node_modules/ listas

  Etapa 2: build
    Copia deps + código fuente
    pnpm build (astro build)
    → dist/ generado

  Etapa 3: runtime
    nginx:1.27-alpine
    Copia dist/ → /usr/share/nginx/html
    Copia docker/nginx.conf → /etc/nginx/conf.d/default.conf
    EXPOSE 80
    HEALTHCHECK en http://localhost/
  │
  ▼
Nginx sirve archivos estáticos en http://localhost:8080
  - try_files $uri $uri/ =404  (rutas estáticas directas)
  - /healthz → 200 "ok"  (monitoreo)
```

### Comandos disponibles

| Comando | Función |
|---|---|
| `make dev` | Levanta entorno de desarrollo con hot reload |
| `make down` | Detiene entorno de desarrollo |
| `make logs` | Tail de logs del servicio web |
| `make shell` | Shell interactivo dentro del contenedor |
| `make prod-up` | Build y levanta entorno producción-like |
| `make prod-down` | Detiene entorno producción-like |
| `make build` | Construye imagen Docker de producción |
| `make run` | Ejecuta imagen de producción localmente |
| `PORT=8081 make prod-up` | Cambia puerto si 8080 está ocupado |

---

## 10. Flujo de contenido (edición de datos)

Todo el contenido del sitio vive en `src/data/`. Editarlo es **inmediato** en dev y requiere un rebuild para producción.

### Estructura de datos

```
src/data/
  ├─ es/
  │    ├─ hero.json         → Hero home, textos de esencia, cards editoriales
  │    ├─ about.json        → Historia, texto de Mauricio y Carolina
  │    ├─ menu.json         → Array de categorías con items (nombre, precio, descripción)
  │    ├─ gallery.json      → Header de galería + array de items multimedia
  │    ├─ contact.json      → Dirección, familia, WhatsApp, mapa
  │    ├─ labels.json       → Labels reutilizables (menú, header)
  │    ├─ events.json       → Eventos y promociones
  │    ├─ faq.json          → Preguntas frecuentes
  │    └─ partial-form.json → Labels y mensajes de validación del formulario
  │
  ├─ en/                    → Misma estructura en inglés
  │
  └─ reviews/
       ├─ reviews.json           → Reseñas procesadas (usadas por el sitio)
       └─ reviews_spreadsheet - reviews.csv  → Fuente editable
```

### Flujo de edición de contenido

```
1. Editar src/data/es/[archivo].json
         +
   Editar src/data/en/[archivo].json  (mantener estructura paralela)
        │
        ▼
2. En desarrollo: cambio reflejado automáticamente (HMR)
        │
        ▼
3. Validar en ambos idiomas:
   http://localhost:4321/es/[página]
   http://localhost:4321/en/[página]
        │
        ▼
4. pnpm build  (verificar que compila sin errores)
        │
        ▼
5. Commit + push → Vercel redeploy automático
```

---

## 11. Flujo de reseñas (CSV → JSON)

Las reseñas del restaurante se mantienen en una hoja de cálculo exportada como CSV y se convierten a JSON para el sitio.

```
Fuente editable:
  src/data/reviews/reviews_spreadsheet - reviews.csv
        │
        ▼
Script de conversión:
  src/utils/csv_to_json.ts     → lee y parsea el CSV
  src/utils/normalizeReviews.ts → normaliza campos (rating, texto, nombre)
        │
        ▼
Archivo generado:
  src/data/reviews/reviews.json
  └─ { reviewCount, averageRating, items: [...] }
        │
        ▼
Consumido por:
  src/components/sections/Reviews.astro  → carrusel de reseñas
  src/utils/seo.ts                        → aggregateRating en JSON-LD
```

---

## 12. Flujo SEO

### Generación de URLs canónicas y hreflang

```
src/utils/seo.ts
  │
  ├─ buildCanonicalUrl(pathname, baseOrigin, lang)
  │    → "https://la-ragazza-web.vercel.app/es/menu"
  │
  ├─ buildAlternateLinks(pathname, baseOrigin)
  │    → [ { hreflang: 'es', href: '.../es/menu' },
  │         { hreflang: 'en', href: '.../en/menu' } ]
  │
  └─ buildXDefault(pathname, baseOrigin)
       → "https://la-ragazza-web.vercel.app/es/menu"
```

### JSON-LD Restaurant schema

```
src/utils/seo.ts → buildRestaurantJsonLd({ lang, pageUrl })
  │
  ▼
Inyectado en Layout.astro como:
  <script type="application/ld+json">
    {
      "@type": "Restaurant",
      "name": "Restaurante La Ragazza",
      "address": { "streetAddress": "Calle 19 #39-66..." },
      "aggregateRating": { ratingValue, reviewCount },
      "openingHours": [...],
      "menu": "/[lang]/menu",
      ...
    }
  </script>
```

### Sitemap y robots.txt

```
pnpm build
  │
  ▼
@astrojs/sitemap genera:
  dist/sitemap-index.xml
  dist/sitemap-0.xml  (todas las rutas indexables)
        │
        ▼
robots.txt declara:
  Sitemap: https://la-ragazza-web.vercel.app/sitemap-index.xml
  Allow: /
  Disallow: /admin/, /wp-admin/, params de búsqueda
```

---

## 13. Flujo de estilos (Design System)

```
src/styles/global.css
  │
  ├─ @import "tailwindcss"  → activa Tailwind v4
  │
  ├─ @theme { }             → define tokens del Design System
  │    ├─ --font-cinzel     → clase font-cinzel (títulos, nav)
  │    ├─ --font-lora       → clase font-lora (cuerpo, párrafos)
  │    ├─ --color-ragazza-primary: #662a2a   (burdeos oscuro)
  │    ├─ --color-ragazza-secondary: #331717 (marrón muy oscuro)
  │    ├─ --color-ragazza-dark: #331717
  │    ├─ --color-ragazza-accent: #749f62    (verde oliva)
  │    └─ --color-ragazza-bg: #f8f7f6        (crema cálido)
  │
  └─ @layer base { body } → tipografía base, antialiased
```

### Tipografía

| Fuente | Clase | Uso |
|---|---|---|
| Cinzel | `font-cinzel` | Títulos, labels, navegación, botones |
| Lora | `font-lora` | Cuerpos de texto, párrafos, descripciones |

### Paleta de colores

| Token | Hex | Uso |
|---|---|---|
| `ragazza-primary` | `#662a2a` | Textos principales, bordes, CTAs |
| `ragazza-secondary` | `#331717` | Fondo oscuro, header, footer |
| `ragazza-dark` | `#331717` | Títulos dark, textos sobre fondo claro |
| `ragazza-accent` | `#749f62` | Acentos verdes, labels, línea decorativa |
| `ragazza-bg` | `#f8f7f6` | Fondo general de páginas |

---

## 14. Mapa de rutas completo

| URL | Archivo fuente | Idioma | Indexable |
|---|---|---|---|
| `/` | `src/pages/index.astro` | — | No (redirect) |
| `/es/` | `src/pages/[lang]/index.astro` | ES | Sí |
| `/en/` | `src/pages/[lang]/index.astro` | EN | Sí |
| `/es/about` | `src/pages/[lang]/about.astro` | ES | Sí |
| `/en/about` | `src/pages/[lang]/about.astro` | EN | Sí |
| `/es/menu` | `src/pages/[lang]/menu.astro` | ES | Sí |
| `/en/menu` | `src/pages/[lang]/menu.astro` | EN | Sí |
| `/es/gallery` | `src/pages/[lang]/gallery.astro` | ES | Sí |
| `/en/gallery` | `src/pages/[lang]/gallery.astro` | EN | Sí |
| `/entrega-parcial-form` | `src/pages/entrega-parcial-form.astro` | — | No (redirect) |
| `/es/entrega-parcial-form` | `src/pages/[lang]/entrega-parcial-form.astro` | ES | No (noindex) |
| `/en/entrega-parcial-form` | `src/pages/[lang]/entrega-parcial-form.astro` | EN | No (noindex) |
| `/robots.txt` | `src/pages/robots.txt.ts` | — | Sistema |
| `/sitemap-index.xml` | Generado por `@astrojs/sitemap` | — | Sistema |

---

## 15. Mapa de dependencias entre archivos

```
Layout.astro
  ├── src/styles/global.css
  ├── src/components/ui/Header.astro
  │     ├── src/i18n/utils.ts
  │     ├── src/data/[lang]/labels.json
  │     └── src/components/ui/LanguageSwitcher.astro
  ├── src/utils/seo.ts
  │     └── src/data/reviews/reviews.json
  └── src/data/[lang]/contact.json  (WhatsApp button)

[lang]/index.astro
  ├── Layout.astro
  ├── src/components/sections/Hero.astro
  ├── src/components/sections/FaqSection.astro
  ├── src/components/sections/Contact.astro
  │     └── src/data/[lang]/contact.json
  ├── src/components/ui/Footer.astro
  │     └── src/i18n/utils.ts
  └── src/data/[lang]/hero.json

[lang]/about.astro
  ├── Layout.astro
  ├── src/data/[lang]/about.json
  ├── src/components/sections/Contact.astro
  └── src/components/ui/Footer.astro

[lang]/menu.astro
  ├── Layout.astro
  ├── src/data/[lang]/menu.json
  ├── src/components/sections/MenuSection.astro
  │     └── src/components/ui/MenuCard.astro
  ├── src/components/sections/Contact.astro
  └── src/components/ui/Footer.astro

[lang]/gallery.astro
  ├── Layout.astro
  ├── src/data/[lang]/gallery.json
  ├── src/components/ui/GalleryItem.astro
  ├── src/components/sections/Reviews.astro
  │     └── src/components/ui/ReviewCard.astro
  ├── src/components/sections/Contact.astro
  └── src/components/ui/Footer.astro

[lang]/entrega-parcial-form.astro
  ├── Layout.astro
  ├── src/data/[lang]/partial-form.json
  ├── src/components/sections/PartialContactForm.astro
  └── src/components/ui/Footer.astro
```

---

## Referencia rápida de comandos

```bash
# Desarrollo local
pnpm install       # instalar dependencias
pnpm dev           # servidor dev en http://localhost:4321

# Build y preview
pnpm build         # compilar sitio estático → dist/
pnpm preview       # previsualizar dist/ en http://localhost:4321

# Docker desarrollo
make dev           # hot reload en contenedor
make down          # detener contenedor dev
make shell         # shell dentro del contenedor

# Docker producción-like
make prod-up       # build + Nginx en http://localhost:8080
make prod-down     # detener stack prod

# Imagen Docker standalone
make build         # construir imagen Docker de producción
make run           # correr imagen en http://localhost:8080
```

---

> Nota: el panel de administración personalizado y su backend/API ya no viven en este repositorio. Se separaron en el repositorio `la-ragazza-admin`. Este documento describe solo el flujo del sitio web público.

_Última actualización: Marzo 2026 — La Ragazza Web_
