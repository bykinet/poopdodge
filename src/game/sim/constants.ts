import { DifficultyLevel, LivesOption } from './types';

export const SCALE_FACTOR = 2 / 3; // 2/3 overall size scaling

export const WORLD_MIN_X = 0;
export const WORLD_MAX_X = 100;
export const PLAYER_HALF_WIDTH = 4 * SCALE_FACTOR; // ~2.67
export const PLAYER_MIN_X = 6;
export const PLAYER_MAX_X = 94;
export const PLAYER_SPEED = 48;

export const INVINCIBLE_DURATION = 0.8; // 800ms

export const POOP_RADIUS = {
  normal: 3.5 * SCALE_FACTOR, // ~2.33
  large: 6.0 * SCALE_FACTOR,  // 4.0
  giant: 12.0 * SCALE_FACTOR, // 8.0
} as const;

export const ITEM_RADIUS = 3.0 * SCALE_FACTOR; // ~2.0

export const CLIMAX_CYCLE_PERIOD = 30.0;
export const CLIMAX_START_LOCAL = 23.0;
export const CLIMAX_END_LOCAL = 28.0;
export const MAX_GIANT_POOPS_IN_AIR = 2;

export const DIFFICULTY_SCORE: Record<DifficultyLevel, number> = {
  1: 10,
  2: 20,
  3: 30,
};

export const LIFE_RISK: Record<LivesOption, number> = {
  1: 1.5,
  2: 1.25,
  3: 1.0,
  4: 0.85,
  5: 0.7,
};

export const MAX_SESSION_SCORE = 999999;

export function getComboMultiplier(streak: number): number {
  if (streak <= 0) return 1.0;
  return Math.min(2.0, 1.0 + 0.1 * Math.floor(streak / 5));
}

export function calculateCleanScore(
  difficulty: DifficultyLevel,
  livesStart: LivesOption,
  isGiant: boolean
): number {
  const diffScore = DIFFICULTY_SCORE[difficulty];
  const risk = LIFE_RISK[livesStart];
  const base = isGiant ? 18 : 6;
  return Math.floor(base * diffScore * risk);
}

export function calculateCloseScore(
  difficulty: DifficultyLevel,
  livesStart: LivesOption,
  isGiant: boolean,
  streak: number
): number {
  const diffScore = DIFFICULTY_SCORE[difficulty];
  const risk = LIFE_RISK[livesStart];
  const mult = getComboMultiplier(streak);
  const base = isGiant ? 40 : 15;
  return Math.floor(base * diffScore * risk * mult);
}

export function calculateItemCatchScore(
  difficulty: DifficultyLevel,
  livesStart: LivesOption,
  isDoubleBonus: boolean
): number {
  const diffScore = DIFFICULTY_SCORE[difficulty];
  const risk = LIFE_RISK[livesStart];
  const base = 25;
  const score = Math.floor(base * diffScore * risk);
  return isDoubleBonus ? score * 2 : score;
}

export function calculateSuccessBonus(
  difficulty: DifficultyLevel,
  livesStart: LivesOption,
  remainingLives: number
): number {
  if (remainingLives <= 0) return 0;
  const diffScore = DIFFICULTY_SCORE[difficulty];
  const risk = LIFE_RISK[livesStart];
  return Math.floor(remainingLives * 50 * diffScore * risk);
}

export function getGrade(score: number, theoreticalMax: number): 'S' | 'A' | 'B' | 'C' {
  if (theoreticalMax <= 0) return 'C';
  const ratio = score / theoreticalMax;
  if (ratio >= 0.9) return 'S';
  if (ratio >= 0.75) return 'A';
  if (ratio >= 0.5) return 'B';
  return 'C';
}
