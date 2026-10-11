import Phaser from 'phaser';

export interface OverlayConfig {
  container: HTMLElement;
}

export class PhaserOverlay {
  private game: Phaser.Game | null = null;
  private scene: Phaser.Scene | null = null;
  private isReady = false;
  private pendingPopups: Array<{ text: string; x: number; y: number; color: string; scale?: number }> = [];

  constructor(config: OverlayConfig) {
    const parent = config.container;
    const width = parent.clientWidth || 800;
    const height = parent.clientHeight || 450;

    const overlayScene = new Phaser.Scene('OverlayScene');
    (overlayScene as any).create = () => {
      this.scene = overlayScene;
      this.isReady = true;

      // Process any queued notifications
      for (const p of this.pendingPopups) {
        this.renderFloatingText(p.text, p.x, p.y, p.color, p.scale);
      }
      this.pendingPopups = [];
    };

    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: parent,
      transparent: true,
      width,
      height,
      banner: false,
      audio: { noAudio: true },
      scene: [overlayScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        transparent: true,
      },
    };

    this.game = new Phaser.Game(phaserConfig);
  }

  public step(dt: number) {
    // Step is synchronized with the master RAF loop
    // Phaser internal clock advances with Three.js dt
  }

  public showJudgmentText(judgment: 'Clean' | 'Close' | 'Hit', worldX: number, scoreGained: number) {
    if (!this.game || !this.scene || !this.isReady) return;

    // Convert worldX [0, 100] to canvas pixel coordinates
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    const pixelX = (worldX / 100) * canvasWidth;
    const pixelY = canvasHeight * 0.72; // Near bottom player ground

    let text = judgment.toUpperCase();
    let color = '#ffffff';

    if (judgment === 'Hit') {
      text = '💥 HIT!';
      color = '#ff3b30';
    } else if (judgment === 'Close') {
      text = `⚡ CLOSE! +${scoreGained}`;
      color = '#ff9500';
    } else {
      text = `✨ CLEAN +${scoreGained}`;
      color = '#34c759';
    }

    this.renderFloatingText(text, pixelX, pixelY, color, 1.2);
  }

  public showCombo(streak: number, worldX: number) {
    if (!this.game || !this.scene || !this.isReady) return;
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    const pixelX = (worldX / 100) * canvasWidth;
    const pixelY = canvasHeight * 0.65;

    this.renderFloatingText(`🔥 COMBO ${streak}!`, pixelX, pixelY, '#ffd60a', 1.4);
  }

  public showShadowHint(worldX: number, text: string) {
    if (!this.game || !this.scene || !this.isReady) return;
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    const pixelX = (worldX / 100) * canvasWidth;
    const pixelY = canvasHeight * 0.55;

    this.renderFloatingText(`⚠️ ${text}`, pixelX, pixelY, '#ffcc00', 1.1, 2000);
  }

  public showClimaxAlert(text: string) {
    if (!this.game || !this.scene || !this.isReady) return;
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    const pixelX = canvasWidth * 0.5;
    const pixelY = canvasHeight * 0.25;

    this.renderFloatingText(`🚨 ${text} 🚨`, pixelX, pixelY, '#ff2d55', 1.8, 2500);
  }

  private renderFloatingText(
    text: string,
    x: number,
    y: number,
    color: string,
    scale: number = 1.0,
    durationMs: number = 1200
  ) {
    if (!this.scene) {
      this.pendingPopups.push({ text, x, y, color, scale });
      return;
    }

    const txtObj = this.scene.add.text(x, y, text, {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: `${Math.round(20 * scale)}px`,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
    });
    txtObj.setOrigin(0.5, 0.5);

    this.scene.tweens.add({
      targets: txtObj,
      y: y - 45,
      alpha: 0,
      scale: scale * 1.15,
      duration: durationMs,
      ease: 'Power1',
      onComplete: () => {
        txtObj.destroy();
      },
    });
  }

  public destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}
