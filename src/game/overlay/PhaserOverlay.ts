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

  public showItemCatch(scoreGained: number, isDouble: boolean, streak: number, worldX: number) {
    if (!this.game || !this.scene || !this.isReady) return;
    const canvasWidth = this.game.canvas.width;
    const canvasHeight = this.game.canvas.height;
    const pixelX = (worldX / 100) * canvasWidth;
    const pixelY = canvasHeight * 0.70;

    if (isDouble) {
      // "참 잘했어요" message with 2x score and fireworks explosion!
      this.renderFloatingText(
        `🎉 참 잘했어요! 점수 2배! +${scoreGained} 🎉`,
        pixelX,
        pixelY - 20,
        '#fef08a',
        1.5,
        2200
      );
      this.triggerFireworks(pixelX, pixelY - 30);
    } else {
      this.renderFloatingText(`🧻 +${scoreGained} (${streak})`, pixelX, pixelY, '#38bdf8', 1.1, 1000);
    }
  }

  private triggerFireworks(x: number, y: number) {
    if (!this.scene) return;
    const colors = [0xff3b30, 0xffcc00, 0x34c759, 0x007aff, 0xaf52de, 0xff2d55];
    const particleCount = 24;

    for (let i = 0; i < particleCount; i++) {
      const color = colors[i % colors.length];
      const particle = this.scene.add.circle(x, y, 4 + Math.random() * 3, color);
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 60 + Math.random() * 90;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed - 20;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
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
