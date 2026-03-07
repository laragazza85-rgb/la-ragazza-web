#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['public', 'src/assets/images'];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function loadSharp() {
  try {
    const sharpModule = await import('sharp');
    return sharpModule.default;
  } catch {
    return null;
  }
}

function walkFiles(dir, accumulator = []) {
  if (!fs.existsSync(dir)) return accumulator;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, accumulator);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) {
      accumulator.push(fullPath);
    }
  }

  return accumulator;
}

async function optimizeFile(sharp, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const input = sharp(filePath);
  let outputBuffer;

  if (ext === '.jpg' || ext === '.jpeg') {
    outputBuffer = await input.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
  } else if (ext === '.png') {
    outputBuffer = await input.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  } else if (ext === '.webp') {
    outputBuffer = await input.webp({ quality: 82 }).toBuffer();
  } else {
    return { before: 0, after: 0, skipped: true };
  }

  const before = fs.statSync(filePath).size;
  const after = outputBuffer.length;

  if (after < before) {
    fs.writeFileSync(filePath, outputBuffer);
    return { before, after, skipped: false };
  }

  return { before, after: before, skipped: true };
}

async function main() {
  const sharp = await loadSharp();

  if (!sharp) {
    console.log('sharp is not installed. Install it first: pnpm add -D sharp');
    process.exit(1);
  }

  const files = TARGET_DIRS.flatMap((relativePath) => walkFiles(path.join(ROOT, relativePath)));

  if (files.length === 0) {
    console.log('No target images found.');
    return;
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let optimizedCount = 0;

  for (const filePath of files) {
    const { before, after, skipped } = await optimizeFile(sharp, filePath);
    totalBefore += before;
    totalAfter += after;
    if (!skipped) optimizedCount += 1;
  }

  const savings = totalBefore - totalAfter;
  const percent = totalBefore > 0 ? ((savings / totalBefore) * 100).toFixed(2) : '0.00';

  console.log(`Processed ${files.length} image(s).`);
  console.log(`Optimized ${optimizedCount} image(s).`);
  console.log(`Saved ${(savings / 1024).toFixed(2)} KB (${percent}%).`);
}

main().catch((error) => {
  console.error('Image optimization failed:', error);
  process.exit(1);
});

