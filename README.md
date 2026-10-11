# poopdodge

Fast-paced single-player comedy dodge game built with Vite, React, TypeScript, Three.js, Phaser 3, and Firebase.

## Features
- **Deterministic 60 FPS Game Loop**: Three.js master RAF loop driving pure simulation and transparent Phaser 3 overlay.
- **Single Player Action**: Falling hazards with dynamic ground shadows and 800ms invincibility on hit.
- **Climax Phase**: Every 30s cycle (23.0s - 28.0s) features a giant cel-shaded butt appearing from the sky with giant hazards.
- **Pre-Game Settings**: Configurable duration (30-180s), difficulty (1-3), starting lives (1-5), and 8 selectable characters.
- **Scoring & Grades**: Combo multipliers, close graze bonuses, life-risk scaling, and grades (S, A, B, C) compared against theoretical maximum.
- **Ending Sequences**: 3.0s animated outcome transitions freezing on custom still cuts before score review.
- **Auth & Profiles**: Email, Google, Phone-to-email virtual authentication, Guest play with account linking.
- **Custom Characters**: In-browser WebP compression (<=256px, quality 85) with Firebase Storage.
- **Internationalization**: i18next supporting English (default) and Korean.

## Getting Started

```bash
# Install dependencies
npm install

# Run locally on http://localhost:3000
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```
