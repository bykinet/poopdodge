import { describe, it, expect, vi } from 'vitest';
import { PoopSim } from '../PoopSim';
import {
  POOP_RADIUS,
  calculateCleanScore,
  calculateCloseScore,
  calculateSuccessBonus,
  getComboMultiplier,
  LIFE_RISK,
  DIFFICULTY_SCORE,
  MAX_SESSION_SCORE,
} from '../constants';
import { calculateTheoreticalMax } from '../theoreticalMax';
import { DurationOption, DifficultyLevel, LivesOption } from '../types';

describe('PoopSim Unit Tests', () => {
  it('correctly calculates Hit, Close, Clean judgments', () => {
    // Normal poop radius is 3.5.
    // Hit if gap <= radius + 4 = 7.5
    // Close if 7.5 < gap <= radius + 10 = 13.5
    // Clean if gap > 13.5

    const sim = new PoopSim({
      duration: 60,
      difficulty: 1,
      lives: 3,
      characterSlot: 0,
    });

    // Test Hit
    sim.state.playerX = 50;
    const hitPoop = {
      id: 99,
      x: 55, // gap = 5 <= 7.5 -> Hit
      type: 'normal' as const,
      radius: POOP_RADIUS.normal,
      fallDuration: 1.0,
      elapsedTime: 1.0,
      height: 0,
      isAimed: false,
    };
    (sim as any).evaluatePoopLanding(hitPoop);
    expect(sim.state.lives).toBe(2);
    expect(sim.state.streak).toBe(0);
    expect(sim.state.hits).toBe(1);

    // Test invincible window: immediately another hit should be ignored
    const hitPoop2 = {
      id: 100,
      x: 50, // gap = 0 -> Hit
      type: 'normal' as const,
      radius: POOP_RADIUS.normal,
      fallDuration: 1.0,
      elapsedTime: 1.0,
      height: 0,
      isAimed: false,
    };
    (sim as any).evaluatePoopLanding(hitPoop2);
    expect(sim.state.lives).toBe(2); // still 2!
    expect(sim.state.hits).toBe(1); // not incremented during invincibility

    // Clear invincibility
    sim.state.invincibleTimer = 0;

    // Test Close: gap 10 (7.5 < 10 <= 13.5)
    const closePoop = {
      id: 101,
      x: 60, // gap = 10
      type: 'normal' as const,
      radius: POOP_RADIUS.normal,
      fallDuration: 1.0,
      elapsedTime: 1.0,
      height: 0,
      isAimed: false,
    };
    (sim as any).evaluatePoopLanding(closePoop);
    expect(sim.state.streak).toBe(1);
    expect(sim.state.closes).toBe(1);

    // Test Clean: gap 20 (20 > 13.5)
    const cleanPoop = {
      id: 102,
      x: 70, // gap = 20
      type: 'normal' as const,
      radius: POOP_RADIUS.normal,
      fallDuration: 1.0,
      elapsedTime: 1.0,
      height: 0,
      isAimed: false,
    };
    (sim as any).evaluatePoopLanding(cleanPoop);
    expect(sim.state.streak).toBe(2);
    expect(sim.state.cleans).toBe(1);
  });

  it('locks aimed poop x at spawn moment and does not follow player movement', () => {
    const sim = new PoopSim({
      duration: 60,
      difficulty: 2,
      lives: 3,
      characterSlot: 0,
    });
    sim.state.playerX = 35;
    sim.state.elapsed = 15; // > 60 * 0.2 (12s)

    // Force an aimed spawn
    const origRandom = Math.random;
    Math.random = () => 0.05; // Force non-large (0.05 < 0.2 is false for isLarge? no: isLarge is < 0.2, so let's control exactly)
    Math.random = vi.fn()
      .mockReturnValueOnce(0.5) // isLarge = false
      .mockReturnValueOnce(0.1); // isAimed = true

    (sim as any).spawnBasePoop();
    Math.random = origRandom;

    const spawned = sim.state.poops[sim.state.poops.length - 1];
    expect(spawned.isAimed).toBe(true);
    expect(spawned.x).toBe(35);

    // Now player moves away to 70
    sim.move(1, 0.5); // moves right
    sim.state.playerX = 70;
    expect(spawned.x).toBe(35); // poop x is unchanged!
  });

  it('spawns poops covering left and right edges and targets edge-camping player', () => {
    const sim = new PoopSim({
      duration: 60,
      difficulty: 1,
      lives: 3,
      characterSlot: 0,
    });

    let minX = 100;
    let maxX = 0;

    // Collect 100 random base poop spawns
    for (let i = 0; i < 100; i++) {
      (sim as any).spawnBasePoop();
      const p = sim.state.poops[sim.state.poops.length - 1];
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    }

    // Must reach close to PLAYER_MIN_X (6) and PLAYER_MAX_X (94)
    expect(minX).toBeLessThan(10);
    expect(maxX).toBeGreaterThan(90);

    // Test edge-camping targeting at left edge (playerX = 6)
    sim.state.playerX = 6;
    let targetedAtLeftEdge = false;
    for (let i = 0; i < 50; i++) {
      (sim as any).spawnBasePoop();
      const p = sim.state.poops[sim.state.poops.length - 1];
      if (p.isAimed && p.x === 6) {
        targetedAtLeftEdge = true;
        break;
      }
    }
    expect(targetedAtLeftEdge).toBe(true);
  });

  it('limits concurrent giant poops in air to 2', () => {
    const sim = new PoopSim({
      duration: 60,
      difficulty: 1,
      lives: 3,
      characterSlot: 0,
    });

    // Set elapsed to climax (24.0s)
    sim.state.elapsed = 24.0;
    sim.state.isClimax = true;
    (sim as any).timeUntilNextSpawn = 0;

    // Spawn 1st giant
    sim.step(0.01);
    expect(sim.state.poops.filter((p) => p.type === 'giant').length).toBe(1);

    // Spawn 2nd giant
    (sim as any).timeUntilNextSpawn = 0;
    sim.step(0.01);
    expect(sim.state.poops.filter((p) => p.type === 'giant').length).toBe(2);

    // Attempt 3rd spawn while 2 are in air
    (sim as any).timeUntilNextSpawn = 0;
    sim.step(0.01);
    expect(sim.state.poops.filter((p) => p.type === 'giant').length).toBe(2); // Still 2!
  });

  it('correctly calculates lifeRisk, comboMultiplier and caps multiplier at 2.0', () => {
    expect(LIFE_RISK[1]).toBe(1.5);
    expect(LIFE_RISK[2]).toBe(1.25);
    expect(LIFE_RISK[3]).toBe(1.0);
    expect(LIFE_RISK[4]).toBe(0.85);
    expect(LIFE_RISK[5]).toBe(0.7);

    expect(getComboMultiplier(0)).toBe(1.0);
    expect(getComboMultiplier(4)).toBe(1.0);
    expect(getComboMultiplier(5)).toBe(1.1);
    expect(getComboMultiplier(10)).toBe(1.2);
    expect(getComboMultiplier(25)).toBe(1.5);
    expect(getComboMultiplier(45)).toBe(1.9);
    expect(getComboMultiplier(50)).toBe(2.0);
    expect(getComboMultiplier(100)).toBe(2.0); // capped at 2.0
  });

  it('handles elapsed intervals 22.9, 23.0, 28.0, 30.0, 53.0 correctly', () => {
    let climaxStarts = 0;
    let climaxEnds = 0;

    const sim = new PoopSim(
      {
        duration: 60,
        difficulty: 1,
        lives: 3,
        characterSlot: 0,
      },
      {
        onClimaxStart: () => {
          climaxStarts++;
        },
        onClimaxEnd: () => {
          climaxEnds++;
        },
      }
    );

    // 22.9s -> not climax
    sim.state.elapsed = 22.89;
    sim.step(0.01);
    expect(sim.state.isClimax).toBe(false);
    expect(climaxStarts).toBe(0);

    // 23.0s -> enters climax
    sim.step(0.1); // now elapsed ~23.0
    expect(sim.state.isClimax).toBe(true);
    expect(climaxStarts).toBe(1);
    // At 23.0s, giant poop must spawn in the same frame
    expect(sim.state.poops.some((p) => p.type === 'giant')).toBe(true);

    // 28.0s -> exits climax
    sim.state.elapsed = 27.99;
    sim.step(0.02); // now elapsed ~28.01
    expect(sim.state.isClimax).toBe(false);
    expect(climaxEnds).toBe(1);

    // 30.0s -> cycle resets, not climax
    sim.state.elapsed = 29.99;
    sim.step(0.02);
    expect(sim.state.isClimax).toBe(false);

    // In a 60s session, at 53.0s (53 = 30 + 23), enters climax again!
    sim.state.elapsed = 52.99;
    sim.step(0.02);
    expect(sim.state.isClimax).toBe(true);
    expect(climaxStarts).toBe(2);
  });

  it('triggers exactly 2 climaxes in a 60s session', () => {
    let climaxStarts = 0;
    const sim = new PoopSim(
      {
        duration: 60,
        difficulty: 1,
        lives: 3,
        characterSlot: 0,
      },
      {
        onClimaxStart: () => {
          climaxStarts++;
        },
      }
    );

    // Step through the entire 60 seconds (player dodges hits to survive)
    const dt = 0.1;
    while (sim.state.outcome === 'in_progress') {
      sim.state.lives = 3; // Keep player alive to verify timing and full duration
      sim.step(dt);
    }

    expect(climaxStarts).toBe(2);
    expect(sim.state.outcome).toBe('success');
  });

  it('verifies theoretical maximum never exceeds 999999 across all configurations', () => {
    const durations: DurationOption[] = [30, 60, 90, 120, 150, 180];
    const difficulties: DifficultyLevel[] = [1, 2, 3];
    const livesList: LivesOption[] = [1, 2, 3, 4, 5];

    for (const d of durations) {
      for (const diff of difficulties) {
        for (const l of livesList) {
          const maxScore = calculateTheoreticalMax(d, diff, l);
          expect(maxScore).toBeGreaterThan(0);
          expect(maxScore).toBeLessThanOrEqual(MAX_SESSION_SCORE);
        }
      }
    }
  });

  it('awards bonus score on item catch and doubles score when consecutive streak reaches 5', () => {
    let caughtEvents: any[] = [];
    const sim = new PoopSim(
      {
        duration: 60,
        difficulty: 1,
        lives: 3,
        characterSlot: 0,
      },
      {
        onItemCaught: (e) => {
          caughtEvents.push(e);
        },
      }
    );

    sim.state.playerX = 50;

    // Simulate catching 4 items
    for (let i = 1; i <= 4; i++) {
      sim.state.items.push({
        id: 100 + i,
        x: 50,
        type: 'toilet_paper',
        radius: 2.0,
        fallDuration: 1.0,
        elapsedTime: 0.9,
        height: 0.1, // in catch zone
      });
      sim.step(0.01);
      expect(sim.state.itemStreak).toBe(i);
      expect(caughtEvents[caughtEvents.length - 1].isDouble).toBe(false);
    }

    // Catch 5th item -> trigger 2x double bonus
    sim.state.items.push({
      id: 105,
      x: 50,
      type: 'toilet_paper',
      radius: 2.0,
      fallDuration: 1.0,
      elapsedTime: 0.9,
      height: 0.1,
    });
    sim.step(0.01);
    expect(sim.state.itemStreak).toBe(5);
    const lastEvent = caughtEvents[caughtEvents.length - 1];
    expect(lastEvent.isDouble).toBe(true);
    expect(lastEvent.scoreGained).toBe(caughtEvents[0].scoreGained * 2);
  });
});
