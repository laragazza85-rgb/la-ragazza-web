#!/usr/bin/env node

/**
 * Script para generar imagen Open Graph 1200x630px
 * Uso: node scripts/generate-og-image.js
 */

const fs = require('fs');
const path = require('path');

// Intentar usar canvas si está disponible, si no, dar instrucciones
try {
  const canvas = require('canvas');
  const { createCanvas } = canvas;

  const width = 1200;
  const height = 630;
  const c = createCanvas(width, height);
  const ctx = c.getContext('2d');

  // Fondo: degradado oscuro (ragazza-dark a ragazza-secondary)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#331717'); // ragazza-dark
  gradient.addColorStop(1, '#662a2a'); // ragazza-primary
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Decoración: círculo en esquina
  ctx.fillStyle = 'rgba(116, 159, 98, 0.15)'; // ragazza-accent con opacidad
  ctx.beginPath();
  ctx.arc(1100, 100, 200, 0, Math.PI * 2);
  ctx.fill();

  // Título principal
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px "Cinzel", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('La Ragazza', width / 2, height / 2 - 100);

  // Subtítulo
  ctx.font = 'italic 36px "Lora", serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText('Comida Italiana Artesanal', width / 2, height / 2 + 40);

  // Línea decorativa
  ctx.strokeStyle = '#749f62'; // ragazza-accent
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 150, height / 2 + 100);
  ctx.lineTo(width / 2 + 150, height / 2 + 100);
  ctx.stroke();

  // Footer
  ctx.font = 'regular 24px "Lora", serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText('Villavicencio, Meta • Desde 1985', width / 2, height - 60);

  // Guardar imagen
  const buffer = c.toBuffer('image/jpeg', { quality: 0.95 });
  const outputPath = path.join(__dirname, '../public/og-image.jpg');

  fs.writeFileSync(outputPath, buffer);
  console.log('✅ Imagen OG generada:', outputPath);
  console.log('   Dimensiones: 1200x630px');
  console.log('   Tamaño: ' + (buffer.length / 1024).toFixed(2) + ' KB');

} catch (error) {
  console.error('⚠️  Módulo "canvas" no instalado.');
  console.log('\nSolución alternativa: Crea la imagen manualmente en Canva:');
  console.log('1. Ve a https://www.canva.com/');
  console.log('2. Crea nuevo diseño → Custom size → 1200 x 630 px');
  console.log('3. Fondo: color oscuro (#331717 o #662a2a)');
  console.log('4. Texto grande (72px): "La Ragazza"');
  console.log('5. Texto medio (36px): "Comida Italiana Artesanal"');
  console.log('6. Subtítulo (24px): "Villavicencio, Meta • Desde 1985"');
  console.log('7. Exporta como JPG, guarda en public/og-image.jpg');
  console.log('\nO usa este template: https://bit.ly/la-ragazza-og-template');
  process.exit(1);
}

