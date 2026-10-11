import { PoopSim } from './sim/PoopSim';
import { GameSettings, JudgmentEvent, SimState } from './sim/types';
import { ThreeScene } from './view/ThreeScene';
import { PhaserOverlay } from './overlay/PhaserOverlay';
import { soundManager } from '../features/audio/soundManager';

export interface GameManagerConfig {
  container3D: HTMLElement;
  containerOverlay: HTMLElement;
  settings: GameSettings;
  characterTextureUrl?: string;
  characterColor?: number;
  showShadowBorder?: boolean;
  onStateChange?: (state: SimState) => void;
  onEndingStart?: (outcome: 'success' | 'failure') => void;
  onEndingStillReached?: (outcome: 'success' | 'failure') => void;
}

export class GameManager {
  public sim: PoopSim;
  public threeScene: ThreeScene;
  public overlay: PhaserOverlay;

  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private onStateChange?: (state: SimState) => void;
  private onEndingStart?: (outcome: 'success' | 'failure') => void;
  private onEndingStillReached?: (outcome: 'success' | 'failure') => void;

  // Ending phase control
  public endingPhase: 'none' | 'playing_3s' | 'still' = 'none';
  public endingTimer = 0;
  public endingOutcome: 'success' | 'failure' | null = null;

  // Active keyboard inputs
  private keysPressed = {
    left: false,
    right: false,
  };

  constructor(config: GameManagerConfig) {
    this.onStateChange = config.onStateChange;
    this.onEndingStart = config.onEndingStart;
    this.onEndingStillReached = config.onEndingStillReached;

    // Simulation
    this.sim = new PoopSim(config.settings, {
      onJudgment: this.handleJudgment,
      onClimaxStart: this.handleClimaxStart,
      onClimaxEnd: this.handleClimaxEnd,
      onGameOver: this.handleGameOver,
      onFirstClimaxWarning: this.handleFirstClimaxWarning,
      onFirstShadowHint: this.handleFirstShadowHint,
      onItemCaught: this.handleItemCaught,
    });

    // Three.js Scene with exact character texture and color
    this.threeScene = new ThreeScene({
      container: config.container3D,
      showShadowBorder: config.showShadowBorder,
      characterTextureUrl: config.characterTextureUrl,
      characterColor: config.characterColor,
    });

    // Phaser 3 Overlay
    this.overlay = new PhaserOverlay({
      container: config.containerOverlay,
    });

    // Setup input listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    soundManager.startBgm();
    this.loop(this.lastTime);
  }

  public pause() {
    this.sim.pause();
    this.onStateChange?.(this.sim.state);
  }

  public resume() {
    this.sim.resume();
    this.lastTime = performance.now();
    this.onStateChange?.(this.sim.state);
  }

  public moveContinuous(dir: -1 | 0 | 1, dt: number) {
    this.sim.move(dir, dt);
  }

  public setPointerWorldX(worldX: number) {
    this.sim.setTargetX(worldX);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keysPressed.left = true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keysPressed.right = true;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.keysPressed.left = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.keysPressed.right = false;
    }
  };

  // Master RAF loop owned by Three.js
  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.endingPhase === 'none') {
      // 1. Process keyboard inputs
      if (this.keysPressed.left && !this.keysPressed.right) {
        this.sim.move(-1, dt);
      } else if (this.keysPressed.right && !this.keysPressed.left) {
        this.sim.move(1, dt);
      }

      // 2. Step Simulation
      this.sim.step(dt);

      // 3. Step Overlay
      this.overlay.step(dt);

      // 4. Update Three Scene
      this.threeScene.update(
        this.sim.state.playerX,
        this.sim.state.invincibleTimer,
        this.sim.state.poops,
        this.sim.state.items,
        this.sim.state.isClimax,
        dt,
        this.sim.getClimaxButtX()
      );

      this.onStateChange?.(this.sim.state);
    } else if (this.endingPhase === 'playing_3s') {
      // Ending 3-second sequence
      this.endingTimer += dt;

      // Update 3D scene visual progression for ending
      this.threeScene.update(
        this.sim.state.playerX,
        0,
        [], // No more poops falling in ending
        [], // No items in ending
        false,
        dt
      );

      if (this.endingTimer >= 3.0) {
        this.endingPhase = 'still';
        this.onEndingStillReached?.(this.endingOutcome!);
      }
    } else if (this.endingPhase === 'still') {
      // Static still frame: just keep rendering still
      this.threeScene.update(this.sim.state.playerX, 0, [], [], false, dt);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private handleJudgment = (event: JudgmentEvent) => {
    // 1. Audio & 3D feedback
    if (event.judgment === 'Hit') {
      soundManager.playHit();
    } else if (event.judgment === 'Close') {
      soundManager.playClose(event.currentStreak);
      this.threeScene.triggerDodgeSpin(); // 3D acrobatic dodge spin!
    } else {
      soundManager.playClean();
    }

    // 2. Visual popup in Phaser overlay
    this.overlay.showJudgmentText(event.judgment, event.poopX, event.scoreGained);

    // 3. Combo feedback every 5 combo
    if (event.currentStreak > 0 && event.currentStreak % 5 === 0) {
      this.overlay.showCombo(event.currentStreak, event.playerX);
    }
  };

  private handleClimaxStart = (_count: number) => {
    soundManager.startClimaxPercussion();
  };

  private handleClimaxEnd = () => {
    soundManager.stopClimaxPercussion();
  };

  private handleFirstClimaxWarning = () => {
    this.overlay.showClimaxAlert('BIG SHADOW INCOMING');
  };

  private handleFirstShadowHint = () => {
    this.overlay.showShadowHint(50, 'DROPS HERE');
  };

  private handleItemCaught = (event: { itemStreak: number; scoreGained: number; isDouble: boolean; x: number }) => {
    this.threeScene.triggerCatchHop(); // 3D catch leap!
    if (event.isDouble) {
      soundManager.playCheer();
    } else {
      soundManager.playClean();
    }
    this.overlay.showItemCatch(event.scoreGained, event.isDouble, event.itemStreak, event.x);
  };

  private handleGameOver = (outcome: 'success' | 'failure', _finalScore: number) => {
    soundManager.stopBgm();
    this.endingOutcome = outcome;
    this.endingPhase = 'playing_3s';
    this.endingTimer = 0;

    if (outcome === 'success') {
      soundManager.playCheer();
    } else {
      soundManager.playSigh();
    }

    this.onEndingStart?.(outcome);
  };

  // Dev tools functions (available in DEV only)
  public devTriggerClimax() {
    if (!import.meta.env.DEV) return;
    this.sim.state.elapsed = 23.0;
  }

  public devTriggerSuccess() {
    if (!import.meta.env.DEV) return;
    this.handleGameOver('success', this.sim.state.score);
  }

  public devTriggerFailure() {
    if (!import.meta.env.DEV) return;
    this.handleGameOver('failure', this.sim.state.score);
  }

  public destroy() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    soundManager.stopBgm();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.threeScene.destroy();
    this.overlay.destroy();
  }
}
