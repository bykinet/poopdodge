import fs from 'fs';
import path from 'path';

// Minimal 1x1 transparent and solid colored valid PNG and GIF byte buffers
// 1x1 PNG generator
function createSolidPng(r, g, b, a = 255) {
  // A minimal valid 64x64 PNG buffer using raw data or base64 standard png
  // We can write a 1x1 base64 png
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64Png, 'base64');
}

// Minimal valid 1x1 animated GIF buffer
function createMinimalGif() {
  const base64Gif = 'R0lGODlhAQABAIABAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAICRAEAOw==';
  return Buffer.from(base64Gif, 'base64');
}

const dirs = [
  'public/brand/icons/desktop',
  'public/brand/icons/mobile',
  'public/brand/thumbnails/still',
  'public/brand/thumbnails/gif',
  'src/game/assets/endings/success',
  'src/game/assets/endings/failure',
  'src/game/assets/ai-generated',
  'src/game/assets/ai-generated/characters',
  'src/game/assets/ai-generated/icons',
];

for (const d of dirs) {
  fs.mkdirSync(path.resolve(d), { recursive: true });
}

const pngFiles = [
  'public/brand/icons/desktop/icon-256.png',
  'public/brand/icons/desktop/icon-512.png',
  'public/brand/icons/desktop/favicon-32.png',
  'public/brand/icons/mobile/apple-touch-180.png',
  'public/brand/icons/mobile/icon-192.png',
  'public/brand/icons/mobile/icon-512.png',
  'public/brand/thumbnails/still/thumbnail.png',
  'src/game/assets/endings/success/still.png',
  'src/game/assets/endings/failure/still.png',
];

const gifFiles = [
  'public/brand/thumbnails/gif/thumbnail.gif',
  'src/game/assets/endings/success/scene.gif',
  'src/game/assets/endings/failure/scene.gif',
];

for (const p of pngFiles) {
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, createSolidPng(255, 200, 100));
  }
}

for (const p of gifFiles) {
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, createMinimalGif());
  }
}

console.log('Placeholders created successfully.');
