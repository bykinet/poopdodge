import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\HS Kim\\.gemini\\antigravity-ide\\brain\\f230bdbb-0ef3-4185-bb05-34ee9fc7c1ca';

// Find brain files by prefix
function findBrainFile(prefix) {
  const files = fs.readdirSync(brainDir);
  const found = files.find((f) => f.startsWith(prefix) && f.endsWith('.jpg'));
  if (!found) throw new Error(`File with prefix ${prefix} not found in ${brainDir}`);
  return path.join(brainDir, found);
}

const targetMappings = [
  {
    prefix: 'toby_3d_dynamic',
    charDest: 'public/game-assets/characters/toby.png',
    aiDest: 'src/game/assets/ai-generated/characters/toby.jpg',
  },
  {
    prefix: 'minji_3d_dynamic',
    charDest: 'public/game-assets/characters/minji.png',
    aiDest: 'src/game/assets/ai-generated/characters/minji.jpg',
  },
  {
    prefix: 'char_leo',
    charDest: 'public/game-assets/characters/leo.png',
    aiDest: 'src/game/assets/ai-generated/characters/leo.jpg',
  },
  {
    prefix: 'char_hana',
    charDest: 'public/game-assets/characters/hana.png',
    aiDest: 'src/game/assets/ai-generated/characters/hana.jpg',
  },
  {
    prefix: 'char_dori',
    charDest: 'public/game-assets/characters/dori.png',
    aiDest: 'src/game/assets/ai-generated/characters/dori.jpg',
  },
  {
    prefix: 'icon_single_poop',
    charDest: 'public/game-assets/items/poop.png',
    aiDest: 'src/game/assets/ai-generated/icons/single_poop.jpg',
  },
  {
    prefix: 'icon_toilet_paper',
    charDest: 'public/game-assets/items/toilet_paper.png',
    aiDest: 'src/game/assets/ai-generated/icons/toilet_paper.jpg',
  },
];

async function processAll() {
  console.log('Processing zero-margin dynamic 3D images...');

  for (const item of targetMappings) {
    const srcPath = findBrainFile(item.prefix);
    console.log(`Cropping zero-margin for ${item.prefix}: ${srcPath}`);

    // Auto-trim background whitespace/margins to tightly frame the subject
    const img = sharp(srcPath);
    const trimmed = await img
      .trim({ threshold: 20 }) // Trim border margins
      .resize(512, 512, {
        fit: 'cover', // Full-bleed, zero empty margin!
        position: 'center',
      })
      .png({ quality: 90 })
      .toBuffer();

    // Ensure output dirs exist
    fs.mkdirSync(path.dirname(item.charDest), { recursive: true });
    fs.mkdirSync(path.dirname(item.aiDest), { recursive: true });

    // Save newly cropped zero-margin files
    fs.writeFileSync(item.charDest, trimmed);
    fs.writeFileSync(item.aiDest, trimmed);

    console.log(`Saved zero-margin asset to: ${item.charDest}`);
  }

  // Delete old placeholder/untrimmed source files in ai-generated if any
  const oldToby = 'src/game/assets/ai-generated/characters/char_toby.jpg';
  if (fs.existsSync(oldToby)) fs.unlinkSync(oldToby);

  console.log('All character & item images converted to zero-margin dynamic 3D assets.');
}

processAll().catch(console.error);
