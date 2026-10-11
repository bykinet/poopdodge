import {
  DifficultyLevel,
  DurationOption,
  LivesOption,
} from './types';
import {
  DIFFICULTY_SCORE,
  LIFE_RISK,
  CLIMAX_CYCLE_PERIOD,
  CLIMAX_START_LOCAL,
  CLIMAX_END_LOCAL,
  MAX_GIANT_POOPS_IN_AIR,
  MAX_SESSION_SCORE,
} from './constants';

export function getBaseCurves(difficulty: DifficultyLevel, elapsed: number) {
  let fallDuration: number;
  let interval: number;

  if (difficulty === 1) {
    const steps = Math.floor(elapsed / 20);
    const factor = Math.pow(0.92, steps);
    fallDuration = Math.max(1.20, 2.40 * factor);
    interval = Math.max(0.55, 1.10 * factor);
  } else if (difficulty === 2) {
    const steps = Math.floor(elapsed / 15);
    const factor = Math.pow(0.90, steps);
    fallDuration = Math.max(0.95, 1.80 * factor);
    interval = Math.max(0.42, 0.85 * factor);
  } else {
    const steps = Math.floor(elapsed / 10);
    const factor = Math.pow(0.88, steps);
    fallDuration = Math.max(0.75, 1.35 * factor);
    interval = Math.max(0.32, 0.62 * factor);
  }

  return { fallDuration, interval };
}

/**
 * Calculates the theoretical maximum score for a given duration, difficulty, and starting lives.
 * Based on the spec:
 * - All base and giant poops yield Close score.
 * - Combo multiplier is 2.0 from the start.
 * - Starting lives all remain (full success bonus).
 * - Giant poops respect max 2 concurrent in air and min interval 0.55s.
 * - Hard score cap: 999999.
 */
export function calculateTheoreticalMax(
  duration: DurationOption,
  difficulty: DifficultyLevel,
  livesStart: LivesOption
): number {
  const diffScore = DIFFICULTY_SCORE[difficulty];
  const risk = LIFE_RISK[livesStart];

  const normalCloseScore = Math.floor(15 * diffScore * risk * 2.0);
  const giantCloseScore = Math.floor(40 * diffScore * risk * 2.0);
  const successBonus = Math.floor(livesStart * 50 * diffScore * risk);

  let totalScore = 0;
  let currentTime = 0;
  let nextSpawnTime = 0;

  // Track active poops: array of landing times
  const activeBasePoops: number[] = [];
  const activeGiantPoops: number[] = [];

  const dt = 0.01; // fine-grained step for deterministic clock simulation

  while (currentTime < duration) {
    // Check poops landing at currentTime
    for (let i = activeBasePoops.length - 1; i >= 0; i--) {
      if (activeBasePoops[i] <= currentTime) {
        totalScore += normalCloseScore;
        activeBasePoops.splice(i, 1);
      }
    }
    for (let i = activeGiantPoops.length - 1; i >= 0; i--) {
      if (activeGiantPoops[i] <= currentTime) {
        totalScore += giantCloseScore;
        activeGiantPoops.splice(i, 1);
      }
    }

    const localTime = currentTime % CLIMAX_CYCLE_PERIOD;
    const isClimax = localTime >= CLIMAX_START_LOCAL && localTime < CLIMAX_END_LOCAL;

    const { fallDuration: baseFall, interval: baseInterval } = getBaseCurves(difficulty, currentTime);

    if (currentTime >= nextSpawnTime) {
      if (isClimax) {
        // Giant poop spawn
        if (activeGiantPoops.length < MAX_GIANT_POOPS_IN_AIR) {
          const giantFall = Math.max(0.90, baseFall * 1.35);
          const giantInterval = Math.max(0.55, baseInterval * 0.5);

          activeGiantPoops.push(currentTime + giantFall);
          nextSpawnTime = currentTime + giantInterval;
        } else {
          // Delayed until a giant poop resolves
          nextSpawnTime = currentTime + dt;
        }
      } else {
        // Normal/Large poop spawn
        // 20% are large poops (fall duration * 1.25)
        // For max score calculation, large vs normal gives same Close score (15 * ...),
        // but large takes longer to fall. Standard base fall is evaluated.
        activeBasePoops.push(currentTime + baseFall);
        nextSpawnTime = currentTime + baseInterval;
      }
    }

    currentTime += dt;
  }

  // Any remaining poops that land on or before duration
  for (const landTime of activeBasePoops) {
    if (landTime <= duration) {
      totalScore += normalCloseScore;
    }
  }
  for (const landTime of activeGiantPoops) {
    if (landTime <= duration) {
      totalScore += giantCloseScore;
    }
  }

  totalScore += successBonus;

  return Math.min(MAX_SESSION_SCORE, totalScore);
}
