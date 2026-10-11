# Poop Dodge Asset Specifications

## Character Assets
- **Base Characters (8 Slots)**:
  - Kids (4): Toby, Minji, Leo, Hana
  - Animals (4): Dori (Shiba), Momo (Cat), Kiki (Bunny), Pomi (Bear)
- **Billboard Dimensions**: 8 units wide × 12 units high (Three.js world units)
- **Sprite Animation States**:
  - `idle`: 4 frames (breathing / subtle bob)
  - `dodge`: 4 frames (leaning dash left/right)
  - `hit`: 4 frames (comic flinch)
  - `cheer`: 4 frames (jump with raised arms)
  - `disappointed`: 4 frames (slumped shoulders)
- **Frame Spec**: 128×192px per frame, transparent WebP / PNG, cel-shaded Japanese anime comedy style.

## Ending Assets
- Success ending:
  - `src/game/assets/endings/success/still.png` (1280×720, 16:9)
  - `src/game/assets/endings/success/scene.gif` (640×360, 3.0 seconds)
- Failure ending:
  - `src/game/assets/endings/failure/still.png` (1280×720, 16:9)
  - `src/game/assets/endings/failure/scene.gif` (640×360, 3.0 seconds)

## Brand Assets
- Desktop icons:
  - `public/brand/icons/desktop/icon-256.png`
  - `public/brand/icons/desktop/icon-512.png`
  - `public/brand/icons/desktop/favicon-32.png`
- Mobile icons:
  - `public/brand/icons/mobile/apple-touch-180.png`
  - `public/brand/icons/mobile/icon-192.png`
  - `public/brand/icons/mobile/icon-512.png`
- Thumbnails:
  - `public/brand/thumbnails/still/thumbnail.png` (1280×720)
  - `public/brand/thumbnails/gif/thumbnail.gif` (640×360, exactly 3.0s loop)
