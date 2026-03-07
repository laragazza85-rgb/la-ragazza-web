#!/usr/bin/env node

/**
 * Generador de imagen OG usando SVG → PNG/JPG
 * Compatible con Vercel y CI/CD
 */

const fs = require('fs');
const path = require('path');

// Crear SVG con la imagen OG
const svgContent = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo degradado oscuro -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#331717;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#662a2a;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Decoración: círculo en esquina superior derecha -->
  <circle cx="1100" cy="100" r="200" fill="#749f62" opacity="0.15"/>
  
  <!-- Decoración: círculo en esquina inferior izquierda -->
  <circle cx="100" cy="550" r="150" fill="#749f62" opacity="0.1"/>
  
  <!-- Título principal: La Ragazza -->
  <text 
    x="600" 
    y="260" 
    font-family="Georgia, serif" 
    font-size="88" 
    font-weight="bold"
    text-anchor="middle" 
    fill="#FFFFFF"
    letter-spacing="2"
  >
    La Ragazza
  </text>
  
  <!-- Subtítulo: Comida Italiana Artesanal -->
  <text 
    x="600" 
    y="350" 
    font-family="Georgia, serif" 
    font-size="42" 
    font-style="italic"
    text-anchor="middle" 
    fill="#FFFFFF"
    opacity="0.95"
  >
    Comida Italiana Artesanal
  </text>
  
  <!-- Línea decorativa -->
  <line 
    x1="350" 
    y1="380" 
    x2="850" 
    y2="380" 
    stroke="#749f62" 
    stroke-width="3"
  />
  
  <!-- Footer: Ubicación y año -->
  <text 
    x="600" 
    y="560" 
    font-family="Georgia, serif" 
    font-size="28"
    text-anchor="middle" 
    fill="#FFFFFF"
    opacity="0.75"
  >
    Villavicencio, Meta • Desde 1985
  </text>
  
  <!-- Borde sutil -->
  <rect 
    x="10" 
    y="10" 
    width="1180" 
    height="610" 
    fill="none" 
    stroke="#749f62" 
    stroke-width="2" 
    opacity="0.3"
  />
</svg>
`;

// Guardar SVG
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const svgPath = path.join(publicDir, 'og-image.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('✅ SVG OG generado:', svgPath);
console.log('   Dimensiones: 1200x630px');

// Intentar convertir a JPG con sharp si está disponible
try {
  const sharp = require('sharp');
  const jpgPath = path.join(publicDir, 'og-image.jpg');

  sharp(svgPath)
    .jpeg({ quality: 95, progressive: true })
    .toFile(jpgPath, (err, info) => {
      if (err) {
        console.warn('⚠️  Error convirtiendo a JPG:', err.message);
        console.log('   Usando SVG como fallback (también válido para OG)');
      } else {
        console.log('✅ JPG OG generado:', jpgPath);
        console.log('   Tamaño:', (info.size / 1024).toFixed(2), 'KB');
      }
    });
} catch (err) {
  console.log('ℹ️  Sharp no disponible - SVG es suficiente para OG tags');
}

