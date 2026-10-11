export interface CharacterInfo {
  id: number;
  name: string;
  nameKo: string;
  color: number;
  colorHex: string;
  category: 'kid' | 'animal' | 'custom';
  avatarUrl?: string;
}

export const BASE_CHARACTERS: CharacterInfo[] = [
  { id: 0, name: 'Toby', nameKo: '토비', color: 0x3b82f6, colorHex: '#3b82f6', category: 'kid', avatarUrl: '/game-assets/characters/toby.png' },
  { id: 1, name: 'Minji', nameKo: '민지', color: 0xef4444, colorHex: '#ef4444', category: 'kid', avatarUrl: '/game-assets/characters/minji.png' },
  { id: 2, name: 'Leo', nameKo: '레오', color: 0x10b981, colorHex: '#10b981', category: 'kid', avatarUrl: '/game-assets/characters/leo.png' },
  { id: 3, name: 'Hana', nameKo: '하나', color: 0x8b5cf6, colorHex: '#8b5cf6', category: 'kid', avatarUrl: '/game-assets/characters/hana.png' },
  { id: 4, name: 'Dori (Shiba)', nameKo: '도리 (시바견)', color: 0xf59e0b, colorHex: '#f59e0b', category: 'animal', avatarUrl: '/game-assets/characters/dori.png' },
  { id: 5, name: 'Momo (Cat)', nameKo: '모모 (고양이)', color: 0xec4899, colorHex: '#ec4899', category: 'animal', avatarUrl: '/game-assets/characters/momo.png' },
  { id: 6, name: 'Kiki (Bunny)', nameKo: '키키 (토끼)', color: 0x06b6d4, colorHex: '#06b6d4', category: 'animal', avatarUrl: '/game-assets/characters/kiki.png' },
  { id: 7, name: 'Pomi (Bear)', nameKo: '포미 (아기곰)', color: 0x84cc16, colorHex: '#84cc16', category: 'animal', avatarUrl: '/game-assets/characters/pomi.png' },
];

export function getEffectiveCharacters(customPaths: string[] = []): CharacterInfo[] {
  // Always 8 selectable slots. Custom uploads replace slots starting from the front (slot 0..3)
  const result: CharacterInfo[] = [];

  for (let i = 0; i < 8; i++) {
    if (i < 4 && customPaths[i]) {
      result.push({
        id: i,
        name: `Custom ${i + 1}`,
        nameKo: `커스텀 ${i + 1}`,
        color: 0x6366f1,
        colorHex: '#6366f1',
        category: 'custom',
        avatarUrl: customPaths[i],
      });
    } else {
      result.push(BASE_CHARACTERS[i]);
    }
  }

  return result;
}
