import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Removes white/light-gray backgrounds and makes them completely transparent PNGs,
 * then trims all empty margins so the 3D subject fills the bounds with zero margin.
 */
async function makeTransparentAndTrim(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = Buffer.from(data);

  // Sample top-left corner color as background reference
  const bgR = pixels[0];
  const bgG = pixels[1];
  const bgB = pixels[2];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Distance from white / neutral light background
      const distFromWhite = Math.sqrt(
        Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2)
      );

      // Distance from corner sample
      const distFromCorner = Math.sqrt(
        Math.pow(bgR - r, 2) + Math.pow(bgG - g, 2) + Math.pow(bgB - b, 2)
      );

      // Color neutralness (gray/white has low saturation)
      const isNeutralLight =
        r > 205 && g > 205 && b > 205 &&
        Math.abs(r - g) < 30 &&
        Math.abs(g - b) < 30 &&
        Math.abs(r - b) < 30;

      if (distFromWhite < 75 || distFromCorner < 45 || isNeutralLight) {
        // Transparent background
        pixels[idx + 3] = 0;
      } else if (distFromWhite < 95 || distFromCorner < 65) {
        // Soft edge antialiasing
        const alpha = Math.min(255, Math.max(0, Math.round((distFromWhite - 75) * 12)));
        pixels[idx + 3] = alpha;
      }
    }
  }

  // Re-encode with transparent alpha, trim bounding margins, and resize to crisp 512x512
  const transparentBuffer = await sharp(pixels, {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();

  const trimmed = await sharp(transparentBuffer)
    .trim() // Trim all transparent margins!
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // zero background!
    })
    .png()
    .toBuffer();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, trimmed);
  console.log(`[Transparent & Zero-Margin Ready] -> ${outputPath}`);
}

async function run() {
  const targets = [
    {
      in: 'public/game-assets/characters/toby.png',
      out: 'public/game-assets/characters/toby.png',
    },
    {
      in: 'public/game-assets/characters/minji.png',
      out: 'public/game-assets/characters/minji.png',
    },
    {
      in: 'public/game-assets/characters/leo.png',
      out: 'public/game-assets/characters/leo.png',
    },
    {
      in: 'public/game-assets/characters/hana.png',
      out: 'public/game-assets/characters/hana.png',
    },
    {
      in: 'public/game-assets/characters/dori.png',
      out: 'public/game-assets/characters/dori.png',
    },
    {
      in: 'public/game-assets/items/poop.png',
      out: 'public/game-assets/items/poop.png',
    },
    {
      in: 'public/game-assets/items/toilet_paper.png',
      out: 'public/game-assets/items/toilet_paper.png',
    },
  ];

  for (const t of targets) {
    await makeTransparentAndTrim(t.in, t.out);
  }
  console.log('All character & item images have transparent backgrounds and zero margin!');
}

run().catch(console.error);
