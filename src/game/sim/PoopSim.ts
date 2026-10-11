import {
  DifficultyLevel,
  DurationOption,
  GameOutcome,
  GameSettings,
  JudgmentEvent,
  JudgmentType,
  LivesOption,
  Poop,
  PoopType,
  SimEventCallbacks,
  SimState,
} from './types';
import {
  CLIMAX_CYCLE_PERIOD,
  CLIMAX_END_LOCAL,
  CLIMAX_START_LOCAL,
  INVINCIBLE_DURATION,
  MAX_GIANT_POOPS_IN_AIR,
  MAX_SESSION_SCORE,
  PLAYER_MAX_X,
  PLAYER_MIN_X,
  PLAYER_SPEED,
  PLAYER_HALF_WIDTH,
  POOP_RADIUS,
  ITEM_RADIUS,
  calculateCleanScore,
  calculateCloseScore,
  calculateItemCatchScore,
  calculateSuccessBonus,
  getComboMultiplier,
} from './constants';
import { getBaseCurves } from './theoreticalMax';

export class PoopSim {
  public state: SimState;
  private callbacks: SimEventCallbacks;
  private nextPoopId = 1;
  private nextItemId = 1;
  private timeUntilNextSpawn = 0;
  private timeUntilNextItemSpawn = 1.0;
  private firstShadowHintGiven = false;

  constructor(settings: GameSettings, callbacks: SimEventCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      settings,
      elapsed: 0,
      playerX: 50, // Center of world [0, 100]
      playerSpeed: PLAYER_SPEED,
      lives: settings.lives,
      score: 0,
      streak: 0,
      maxCombo: 0,
      cleans: 0,
      closes: 0,
      hits: 0,
      giantCleans: 0,
      giantCloses: 0,
      giantHits: 0,
      invincibleTimer: 0,
      outcome: 'in_progress',
      isPaused: false,
      isClimax: false,
      climaxCount: 0,
      firstClimaxShown: false,
      poops: [],
      items: [],
      itemStreak: 0,
    };
  }

  public setCallbacks(callbacks: SimEventCallbacks) {
    this.callbacks = callbacks;
  }

  public pause() {
    this.state.isPaused = true;
  }

  public resume() {
    this.state.isPaused = false;
  }

  public move(direction: -1 | 0 | 1, dt: number) {
    if (this.state.isPaused || this.state.outcome !== 'in_progress') return;
    this.state.playerX += direction * this.state.playerSpeed * dt;
    this.clampPlayerX();
  }

  public setTargetX(targetX: number) {
    if (this.state.isPaused || this.state.outcome !== 'in_progress') return;
    this.state.playerX = targetX;
    this.clampPlayerX();
  }

  private clampPlayerX() {
    if (this.state.playerX < PLAYER_MIN_X) this.state.playerX = PLAYER_MIN_X;
    if (this.state.playerX > PLAYER_MAX_X) this.state.playerX = PLAYER_MAX_X;
  }

  public step(dt: number) {
    if (this.state.isPaused || this.state.outcome !== 'in_progress') return;

    const prevElapsed = this.state.elapsed;
    this.state.elapsed += dt;

    // Check first shadow hint (within first 15 seconds)
    if (!this.firstShadowHintGiven && this.state.poops.length > 0 && this.state.elapsed <= 15) {
      this.firstShadowHintGiven = true;
      this.callbacks.onFirstShadowHint?.();
    }

    // Invincibility countdown
    if (this.state.invincibleTimer > 0) {
      this.state.invincibleTimer = Math.max(0, this.state.invincibleTimer - dt);
    }

    // Check if session completed by duration
    if (this.state.elapsed >= this.state.settings.duration) {
      this.state.outcome = 'success';
      const bonus = calculateSuccessBonus(
        this.state.settings.difficulty,
        this.state.settings.lives,
        this.state.lives
      );
      this.state.score = Math.min(MAX_SESSION_SCORE, this.state.score + bonus);
      this.callbacks.onGameOver?.('success', this.state.score);
      return;
    }

    // Climax handling
    const local = this.state.elapsed % CLIMAX_CYCLE_PERIOD;
    const isClimaxNow = local >= CLIMAX_START_LOCAL && local < CLIMAX_END_LOCAL;

    // Detect entering climax
    if (!this.state.isClimax && isClimaxNow) {
      this.state.isClimax = true;
      this.state.climaxCount++;
      this.callbacks.onClimaxStart?.(this.state.climaxCount);

      if (!this.state.firstClimaxShown) {
        this.state.firstClimaxShown = true;
        this.callbacks.onFirstClimaxWarning?.();
      }

      // At 23.0s, in the same frame, the first giant poop shadow appears!
      this.spawnGiantPoop();
      const { interval: baseInterval } = getBaseCurves(this.state.settings.difficulty, this.state.elapsed);
      this.timeUntilNextSpawn = Math.max(0.55, baseInterval * 0.5);
    } else if (this.state.isClimax && !isClimaxNow) {
      // Exiting climax (at 28.0s)
      this.state.isClimax = false;
      this.callbacks.onClimaxEnd?.();
      const { interval: baseInterval } = getBaseCurves(this.state.settings.difficulty, this.state.elapsed);
      this.timeUntilNextSpawn = baseInterval;
    }

    // Spawn countdown
    this.timeUntilNextSpawn -= dt;
    if (this.timeUntilNextSpawn <= 0) {
      if (this.state.isClimax) {
        const giantCount = this.state.poops.filter((p) => p.type === 'giant').length;
        if (giantCount < MAX_GIANT_POOPS_IN_AIR) {
          this.spawnGiantPoop();
          const { interval: baseInterval } = getBaseCurves(
            this.state.settings.difficulty,
            this.state.elapsed
          );
          this.timeUntilNextSpawn = Math.max(0.55, baseInterval * 0.5);
        } else {
          // Retry soon until one lands
          this.timeUntilNextSpawn = 0.05;
        }
      } else {
        this.spawnBasePoop();
        const { interval: baseInterval } = getBaseCurves(
          this.state.settings.difficulty,
          this.state.elapsed
        );
        this.timeUntilNextSpawn = baseInterval;
      }
    }

    // Spawn collectible items (Toilet paper) frequently between poops
    this.timeUntilNextItemSpawn -= dt;
    if (this.timeUntilNextItemSpawn <= 0) {
      this.spawnCollectibleItem();
      // Schedule next item frequently (1.4s to 2.2s)
      this.timeUntilNextItemSpawn = 1.4 + Math.random() * 0.8;
    }

    // Update existing poops and evaluate landings
    for (let i = this.state.poops.length - 1; i >= 0; i--) {
      const poop = this.state.poops[i];
      poop.elapsedTime += dt;
      poop.height = Math.max(0, 1.0 - poop.elapsedTime / poop.fallDuration);

      if (poop.height <= 0) {
        this.evaluatePoopLanding(poop);
        this.state.poops.splice(i, 1);
        if (this.state.outcome !== 'in_progress') break;
      }
    }

    // Update collectible items and check player catch collision
    for (let i = this.state.items.length - 1; i >= 0; i--) {
      const item = this.state.items[i];
      item.elapsedTime += dt;
      item.height = Math.max(0, 1.0 - item.elapsedTime / item.fallDuration);

      // Check collision when item is within catch range (height <= 0.25)
      const gap = Math.abs(this.state.playerX - item.x);
      const catchRadius = PLAYER_HALF_WIDTH + item.radius + 3.0;

      if (item.height <= 0.25 && gap <= catchRadius) {
        // Caught!
        this.state.itemStreak += 1;
        const isDouble = this.state.itemStreak >= 5;
        const scoreGained = calculateItemCatchScore(
          this.state.settings.difficulty,
          this.state.settings.lives,
          isDouble
        );
        this.state.score = Math.min(MAX_SESSION_SCORE, this.state.score + scoreGained);
        this.callbacks.onItemCaught?.({
          itemStreak: this.state.itemStreak,
          scoreGained,
          isDouble,
          x: item.x,
        });
        this.state.items.splice(i, 1);
        continue;
      }

      // If missed and reached ground
      if (item.height <= 0) {
        this.state.itemStreak = 0; // reset consecutive streak
        this.callbacks.onItemMissed?.();
        this.state.items.splice(i, 1);
      }
    }
  }

  private spawnCollectibleItem() {
    const spawnX = 14 + Math.random() * (86 - 14);
    const fallDuration = 1.8 + Math.random() * 0.7; // 1.8s to 2.5s
    this.state.items.push({
      id: this.nextItemId++,
      x: spawnX,
      type: 'toilet_paper',
      radius: ITEM_RADIUS,
      fallDuration,
      elapsedTime: 0,
      height: 1.0,
    });
  }

  private spawnBasePoop() {
    const { fallDuration: baseFall } = getBaseCurves(this.state.settings.difficulty, this.state.elapsed);
    const isLarge = Math.random() < 0.2;
    let isAimed = false;

    // In difficulty 2 and 3, after 20% elapsed time, 20% of non-large spawns are aimed
    if (!isLarge && this.state.settings.difficulty > 1) {
      if (this.state.elapsed >= this.state.settings.duration * 0.2) {
        if (Math.random() < 0.2) {
          isAimed = true;
        }
      }
    }

    let spawnX: number;
    if (isAimed) {
      spawnX = this.state.playerX;
    } else {
      spawnX = 12 + Math.random() * (88 - 12);
    }

    const type: PoopType = isLarge ? 'large' : 'normal';
    const radius = isLarge ? POOP_RADIUS.large : POOP_RADIUS.normal;
    const fallDuration = isLarge ? baseFall * 1.25 : baseFall;

    this.state.poops.push({
      id: this.nextPoopId++,
      x: spawnX,
      type,
      radius,
      fallDuration,
      elapsedTime: 0,
      height: 1.0,
      isAimed,
    });
  }

  public getClimaxButtX(): number {
    if (!this.state.isClimax) return 50;
    const local = this.state.elapsed % CLIMAX_CYCLE_PERIOD;
    const progress = Math.max(0, local - CLIMAX_START_LOCAL);
    // King Butt slowly sways smoothly between x = 24 and 76
    return 50 + Math.sin(progress * 1.5) * 26;
  }

  private spawnGiantPoop() {
    const { fallDuration: baseFall } = getBaseCurves(this.state.settings.difficulty, this.state.elapsed);
    const spawnX = this.getClimaxButtX();
    const fallDuration = Math.max(1.10, baseFall * 1.4);

    this.state.poops.push({
      id: this.nextPoopId++,
      x: spawnX,
      type: 'giant',
      radius: POOP_RADIUS.giant,
      fallDuration,
      elapsedTime: 0,
      height: 1.0,
      isAimed: false,
    });
  }

  private evaluatePoopLanding(poop: Poop) {
    const gap = Math.abs(this.state.playerX - poop.x);
    let judgment: JudgmentType;
    let scoreGained = 0;

    if (gap <= poop.radius + 4) {
      judgment = 'Hit';
      if (this.state.invincibleTimer <= 0) {
        this.state.lives -= 1;
        this.state.streak = 0;
        this.state.invincibleTimer = INVINCIBLE_DURATION;
        if (poop.type === 'giant') {
          this.state.giantHits++;
        } else {
          this.state.hits++;
        }

        if (this.state.lives <= 0) {
          this.state.outcome = 'failure';
          this.callbacks.onGameOver?.('failure', this.state.score);
        }
      }
    } else if (gap <= poop.radius + 10) {
      judgment = 'Close';
      this.state.streak += 1;
      if (this.state.streak > this.state.maxCombo) {
        this.state.maxCombo = this.state.streak;
      }
      scoreGained = calculateCloseScore(
        this.state.settings.difficulty,
        this.state.settings.lives,
        poop.type === 'giant',
        this.state.streak
      );
      this.state.score = Math.min(MAX_SESSION_SCORE, this.state.score + scoreGained);
      if (poop.type === 'giant') {
        this.state.giantCloses++;
      } else {
        this.state.closes++;
      }
    } else {
      judgment = 'Clean';
      this.state.streak += 1;
      if (this.state.streak > this.state.maxCombo) {
        this.state.maxCombo = this.state.streak;
      }
      scoreGained = calculateCleanScore(
        this.state.settings.difficulty,
        this.state.settings.lives,
        poop.type === 'giant'
      );
      this.state.score = Math.min(MAX_SESSION_SCORE, this.state.score + scoreGained);
      if (poop.type === 'giant') {
        this.state.giantCleans++;
      } else {
        this.state.cleans++;
      }
    }

    this.callbacks.onJudgment?.({
      poopId: poop.id,
      poopType: poop.type,
      judgment,
      gap,
      scoreGained,
      currentStreak: this.state.streak,
      multiplier: getComboMultiplier(this.state.streak),
      playerX: this.state.playerX,
      poopX: poop.x,
    });
  }
}
