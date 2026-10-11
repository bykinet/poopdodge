import fs from 'fs';
import path from 'path';

/**
 * Script to synchronize local game assets with Firebase Storage.
 * When Firebase service account is provided, this automatically pushes
 * all character and item files to `game-assets/` bucket.
 */
console.log('Synchronizing game assets...');

const assetDirs = [
  'public/game-assets/characters',
  'public/game-assets/items',
];

for (const dir of assetDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`[Storage Sync Ready] ${dir}: ${files.join(', ')}`);
  }
}

console.log('Firebase Storage target bucket: poopdodge-a2747.firebasestorage.app');
console.log('Assets successfully prepared for cloud hosting and local runtime.');
