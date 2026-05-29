# Plan de Implementación SEO - La Ragazza Web

## Resumen Ejecutivo

**Score actual:** 88/100
**Score objetivo:** 95+/100
**Problemas identificados:** 6 Failed, 4 Warnings

---

## Priority 1: HIGH - Implementación Inmediata

### 1.1 Eliminar Render-Blocking Resources
**Gravedad:** High
**Archivo a modificar:** `src/layouts/Layout.astro`

**Problema:** Los recursos CSS/JS bloquean el renderizado de la página.

**Solución:**
1. Mover CSS crítico a inline en `<head>`
2. Agregar atributos `defer` o `async` a scripts no esenciales
3. Preload de fuentes críticas
4. Verificar en Google PageSpeed Insights que los cambios funcionan

**Pasos:**
```bash
# 1. Identificar CSS crítico usando Chrome DevTools Coverage
# 2. En Layout.astro, mover CSS crítico a <style is:inline>
# 3. Agregar defer a scripts:
#    <script src={scriptSrc} defer></script>
# 4. Agregar preconnect a recursos externos:
#    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

---

### 1.2 Crear Página 404 Custom
**Gravedad:** Medium
**Archivo a crear:** `src/pages/404.astro`

**Problema:** El sitio usa la página 404 por defecto de Vercel/Astro.

**Solución:**
1. Crear componente de error 404 con diseño consistente
2. Incluir links útiles (Inicio, Menú, Galería, Contacto)
3. Mostrar mensaje amigable y opción de contactar por WhatsApp
4. Mantener el mismo Layout con SEO tags

**Contenido sugerido:**
- "Ups! Esta página no existe"
- Link a inicio
- Link al menú
- Link a galería
- Botón WhatsApp
- Imagen o ilustración del restaurante

---

## Priority 2: MEDIUM - Optimización de Contenido

### 2.1 Aumentar Text Content (Word Count)
**Gravedad:** Low (pero afecta SEO)
**Archivos a modificar:** `src/pages/[lang]/index.astro`, `src/data/es/hero.json`

**Problema:** 342 palabras - demasiado bajo. Buenos valores: 800+.

**Solución - Expandir contenido:**

1. **Hero Section:** Agregar descripción más detallada (2-3 párrafos adicionales)
2. **Sección "Nuestra Historia":** Expandir de 1 línea a 3-4 párrafos
3. **Sección "Nuestro Menú":** Agregar descripciones a cada categoría
4. **Sección FAQ:** Expandir respuestas con más detalle
5. **Agregar testimonios** (3-5 reseñas de clientes)
6. **Agregar sección "Por qué elegirnos"** con 4-5 bullet points

**Contenido a agregar en `hero.json` y `index.astro`:**
```
- Historia de la familia López desde 1985
- Filosofía de cocina artesanal
- Ingredientes frescos y recetas tradicionales
- Ambiente familiar
- Reconocimientos/prensiones
```

### 2.2 Distribuir Keywords Mejor en HTML Tags
**Gravedad:** Low
**Problema:** Keywords como "ragazza", "reservar", "restaurante" no están en todos los tags necesarios.

**Solución:**
1. Asegurar que el H1 contenga keyword principal "La Ragazza"
2. Agregar keyword "restaurante italiano" en H2s
3. Distribuir keywords secundarias en paragraphs
4. Agregar alt text descriptivo a imágenes

### 2.3 Agregar Meta Description Más Larga
**Gravedad:** Low
**Archivo:** `src/layouts/Layout.astro` línea ~47

**Problema:** Meta description 132 caracteres (recomendado: 150-220).

**Solución:** Expandir a 150-170 caracteres manteniendo keywords importantes.

---

## Priority 3: TECHNICAL SEO - Correcciones Varias

### 3.1 Eliminar Inline Styles
**Gravedad:** Low
**Archivos a modificar:** `src/components/**/*.astro`

**Problema:** El audit detecta inline styles que degradan performance.

**Solución:**
1. Escanear todos los archivos .astro en busca de `style="..."` inline
2. Mover estilos a clases Tailwind o al archivo CSS global
3. Usar la convención de nombres de Tailwind

### 3.2 Eliminar iFrames
**Gravedad:** Low
**Archivos:** Buscar `<iframe` en todo el proyecto

**Problema:** iFrames complican navegación mobile y son difíciles de indexar.

**Solución:**
1. Si es para Google Maps, usar Google Maps Embed API con lazy loading
2. Si es para video, usar YouTube embed con `loading="lazy"`

### 3.3 Agregar Favicon Correctamente
**Gravedad:** Low
**Archivo:** `public/favicon.ico` y `src/layouts/Layout.astro`

**Problema:** El audit indica problema con favicon.

**Solución:**
1. Verificar que `favicon.ico` existe en `/public`
2. Asegurar link correcto en Layout:
   ```html
   <link rel="icon" type="image/x-icon" href="/favicon.ico">
   ```

### 3.4 Reducir HTTP Requests (20+)
**Gravedad:** Low
**Problema:** 31 requests total - el audit sugiere <20.

**Solución:**
1. Consolidar archivos JS en un solo bundle (Astro ya lo hace)
2. Combinar iconos en sprite SVG
3. Lazy loading de imágenes y iframes
4. Eliminar requests a recursos no utilizados

---

## Priority 4: SOCIAL & LOCAL SEO

### 4.1 Instalar Facebook Pixel
**Gravedad:** Low
**Archivo:** `src/layouts/Layout.astro`

**Problema:** No hay Facebook Pixel instalado.

**Solución:**
1. Crear cuenta Facebook Business > Pixels
2. Obtener el ID del Pixel (ej: 123456789)
3. Agregar en Layout.astro antes del `</head>`:
   ```html
   <!-- Facebook Pixel -->
   <script>
     !function(f,b,e,v,n,t,s)
     {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
     n.callMethod.apply(n,arguments):n.queue.push(arguments)};
     if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
     n.queue=[];t=b.createElement(e);t.async=!0;
     t.src=v;s=b.getElementsByTagName(e)[0];
     s.parentNode.insertBefore(t,s)}(window, document,'script',
     'https://connect.facebook.net/en_US/fbevents.js');
     fbq('init', 'TU_PIXEL_ID');
     fbq('track', 'PageView');
   </script>
   <noscript>
     <img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=TU_PIXEL_ID&ev=PageView&noscript=1"/>
   </noscript>
   ```

### 4.2 Vincular YouTube Channel
**Gravedad:** Low
**Archivo:** `src/components/Footer.astro` o `src/layouts/Layout.astro`

**Problema:** No hay link a YouTube.

**Solución:**
1. Crear canal de YouTube para La Ragazza
2. Agregar link en footer y redes sociales
3. Agregar video embebido en página About o Home

### 4.3 Agregar X (Twitter) Profile Link
**Gravedad:** Low
**Archivos:** `src/components/Footer.astro`, `src/components/SocialLinks.astro`

**Problema:** No hay link a X Profile.

**Solución:**
1. Crear cuenta X para La Ragazza
2. Agregar en footer, usualmente ya existe link a Instagram/Facebook

### 4.4 Agregar LinkedIn Profile
**Gravedad:** Low
**Archivos:** `src/components/Footer.astro`

**Problema:** No hay link a LinkedIn.

**Solución:**
1. Crear LinkedIn Company Page
2. Agregar link en footer

### 4.5 Agregar Address y Phone Visibles
**Gravedad:** Low
**Archivos:** `src/components/Contact.astro`, `src/components/Footer.astro`

**Problema:** "Missing: Phone, Address" - el audit no los detecta.

**Solución:**
1. Verificar que estos datos estén en el JSON-LD (ya deberían estar)
2. Agregar en sección contacto visible en homepage
3. Incluir Schema markup de LocalBusiness completo

---

## Priority 5: DNS & EMAIL SECURITY (Fuera de Código)

### 5.1 Agregar SPF Record
**Gravedad:** Low
**Tipo:** Configuración DNS (no código)

**Problema:** "Without an SPF record, spammers can easily spoof emails"

**Solución:**
```
# En tu proveedor DNS (Vercel, Cloudflare, etc.)
TXT Record @: v=spf1 include:_spf.google.com ~all
```
**Responsabilidad:** El usuario debe hacer esto en su panel DNS.

### 5.2 Agregar DMARC Record
**Gravedad:** Low
**Tipo:** Configuración DNS (no código)

**Problema:** No hay DMARC record.

**Solución:**
```
# En tu proveedor DNS
TXT Record _dmarc: v=DMARC1; p=quarantine; rua=mailto:admin@laragazza.com.co
```
**Responsabilidad:** El usuario debe hacer esto en su panel DNS.

---

## Priority 6: GEO (Generative Engine Optimization)

### 6.1 Mejorar Rendered Content para LLMs
**Gravedad:** Low
**Problema:** "Rendering Percentage: 0%" - LLMs tienen dificultad leyendo el contenido.

**Solución:**
1. Asegurar que el contenido HTML sea semanticamente correcto
2. Mejorar estructura con `<article>`, `<section>`, `<aside>` donde aplique
3. Mantener el `llms.txt` actualizado
4. Evitar contenido generado dinámicamente por JS

### 6.2 Verificar llms.txt
**Archivo:** `public/llms.txt`

**Problema:** Existe pero verificar que esté actualizado con información completa.

---

## Priority 7: PERFORMANCE

### 7.1 Optimizar Mobile PageSpeed
**Problema:** Mobile 3.4s FCP, Desktop 0.9s FCP

**Solución:**
1. Eliminar render-blocking resources (Priority 1.1)
2. Lazy loading de iframes (Google Maps)
3. Optimizar fuentes (mostrar solo fonts necesarios)
4. Compresión de imágenes

### 7.2 Implementar HTTP/2 Push o Preload
**Problema:** Usar HTTP/2 de forma más efectiva.

**Solución:**
1. Vercel ya usa HTTP/2 por defecto
2. Agregar `link rel="preload"` para recursos críticos
3. Considerar `modulepreload` para módulos JS

---

## Checklist de Implementación

### Fase 1: High Priority (1 día)
- [ ] Crear página 404 custom
- [ ] Eliminar render-blocking resources

### Fase 2: Medium Priority (1 día)
- [ ] Expandir contenido (800+ palabras)
- [ ] Distribuir keywords en HTML tags
- [ ] Expandir meta description (150-170 chars)

### Fase 3: Technical Fixes (½ día)
- [ ] Eliminar inline styles
- [ ] Lazy load iframes
- [ ] Verificar favicon
- [ ] Reducir HTTP requests

### Fase 4: Social & Local SEO (½ día)
- [ ] Instalar Facebook Pixel
- [ ] Agregar links a YouTube, X, LinkedIn
- [ ] Verificar address/phone visibles

### Fase 5: DNS (fuera de código)
- [ ] Agregar SPF record
- [ ] Agregar DMARC record

### Fase 6: GEO (1-2 horas)
- [ ] Verificar llms.txt actualizado
- [ ] Mejorar estructura semántica HTML

---

## Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/404.astro` | Crear |
| `src/layouts/Layout.astro` | Modificar |
| `src/pages/[lang]/index.astro` | Modificar |
| `src/components/*.astro` | Modificar (estilos inline) |
| `src/data/es/hero.json` | Modificar |
| `src/data/es/labels.json` | Modificar (keywords) |
| `public/llms.txt` | Modificar |
| `public/favicon.ico` | Verificar existe |

## Comandos de Verificación

```bash
# Build y verificar
pnpm build

# Typecheck
pnpm typecheck

# PageSpeed test (después de cambios)
# Visitar: https://pagespeed.web.dev/
# URL: https://la-ragazza-web.vercel.app/es/

# SEO test (después de cambios)
# Visitar: https://sitechecker.pro/
# URL: https://la-ragazza-web.vercel.app/es/
```
