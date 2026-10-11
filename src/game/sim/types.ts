export type DifficultyLevel = 1 | 2 | 3;
export type DurationOption = 30 | 60 | 90 | 120 | 150 | 180;
export type LivesOption = 1 | 2 | 3 | 4 | 5;

export type PoopType = 'normal' | 'large' | 'giant';

export interface Poop {
  id: number;
  x: number;
  type: PoopType;
  radius: number;
  fallDuration: number;
  elapsedTime: number;
  height: number; // 1.0 (top) -> 0.0 (judgment line)
  isAimed: boolean;
}

export type JudgmentType = 'Clean' | 'Close' | 'Hit';

export interface JudgmentEvent {
  poopId: number;
  poopType: PoopType;
  judgment: JudgmentType;
  gap: number;
  scoreGained: number;
  currentStreak: number;
  multiplier: number;
  playerX: number;
  poopX: number;
}

export interface GameSettings {
  duration: DurationOption;
  difficulty: DifficultyLevel;
  lives: LivesOption;
  characterSlot: number; // 0 to 7
}

export type GameOutcome = 'in_progress' | 'success' | 'failure';

export interface CollectibleItem {
  id: number;
  x: number;
  type: 'toilet_paper';
  radius: number;
  fallDuration: number;
  elapsedTime: number;
  height: number;
}

export interface SimState {
  settings: GameSettings;
  elapsed: number;
  playerX: number;
  playerSpeed: number;
  lives: number;
  score: number;
  streak: number;
  maxCombo: number;
  cleans: number;
  closes: number;
  hits: number;
  giantCleans: number;
  giantCloses: number;
  giantHits: number;
  invincibleTimer: number; // > 0 means invincible
  outcome: GameOutcome;
  isPaused: boolean;
  isClimax: boolean;
  climaxCount: number;
  firstClimaxShown: boolean;
  poops: Poop[];
  items: CollectibleItem[];
  itemStreak: number;
}

export interface SimEventCallbacks {
  onJudgment?: (event: JudgmentEvent) => void;
  onClimaxStart?: (climaxNumber: number) => void;
  onClimaxEnd?: () => void;
  onGameOver?: (outcome: 'success' | 'failure', finalScore: number) => void;
  onFirstClimaxWarning?: () => void;
  onFirstShadowHint?: () => void;
  onItemCaught?: (event: { itemStreak: number; scoreGained: number; isDouble: boolean; x: number }) => void;
  onItemMissed?: () => void;
}
