"use client";

import { useEffect, useRef } from "react";

export interface PhaserBattleSceneHandle {
  triggerPlayerAttack: () => void;
  triggerPlayerHurt: () => void;
  triggerBossHurt: (damage: number) => void;
}

interface Props {
  bossSheetUrl: string;
  width?: number;
  height?: number;
  onReady?: (handle: PhaserBattleSceneHandle) => void;
}

// Frame layout — 4 columns × 3 rows, 1200×896 sheet
// Row 0: idle (frames 0–3) · Row 1: attack (4–7) · Row 2: hurt (8–11)
// FRAME_H = 298 so that floor(896/298)=3 rows; 299 only gives floor(896/299)=2 rows
const FRAME_W = 300;
const FRAME_H = 298;

export default function PhaserBattleScene({
  bossSheetUrl,
  width = 600,
  height = 260,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  // store scene methods so parent can call them via the handle
  const methodsRef = useRef<{
    playerAttack: () => void;
    playerHurt: () => void;
    bossHurt: (dmg: number) => void;
  } | null>(null);

  useEffect(() => {
    async function init() {
      const Phaser = (await import("phaser")).default;

      class BattleScene extends Phaser.Scene {
        private player!: Phaser.GameObjects.Sprite;
        private boss!: Phaser.GameObjects.Sprite;
        private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

        constructor() { super({ key: "BattleScene" }); }

        preload() {
          this.load.spritesheet("hero", "/sprites/hero_sheet.png", { frameWidth: FRAME_W, frameHeight: FRAME_H });
          this.load.spritesheet("boss", bossSheetUrl,              { frameWidth: FRAME_W, frameHeight: FRAME_H });
        }

        create() {
          const W = this.scale.width;
          const H = this.scale.height;

          // Ground
          const g = this.add.graphics();
          g.fillStyle(0x0f172a, 0.3);
          g.fillRect(0, H - 40, W, 40);
          g.lineStyle(1, 0x334155, 0.4);
          g.lineBetween(0, H - 40, W, H - 40);

          // Animations
          this.anims.create({ key: "hero-idle",   frames: this.anims.generateFrameNumbers("hero", { start: 0, end: 3  }), frameRate: 6,  repeat: -1 });
          this.anims.create({ key: "hero-attack", frames: this.anims.generateFrameNumbers("hero", { start: 4, end: 7  }), frameRate: 12, repeat: 0  });
          this.anims.create({ key: "hero-hurt",   frames: this.anims.generateFrameNumbers("hero", { start: 8, end: 11 }), frameRate: 10, repeat: 0  });
          this.anims.create({ key: "boss-idle",   frames: this.anims.generateFrameNumbers("boss", { start: 0, end: 3  }), frameRate: 5,  repeat: -1 });
          this.anims.create({ key: "boss-attack", frames: this.anims.generateFrameNumbers("boss", { start: 4, end: 7  }), frameRate: 10, repeat: 0  });
          this.anims.create({ key: "boss-hurt",   frames: this.anims.generateFrameNumbers("boss", { start: 8, end: 11 }), frameRate: 10, repeat: 0  });

          // Sprites
          this.player = this.add.sprite(W * 0.22, H - 45, "hero").setOrigin(0.5, 1).setScale(0.55);
          this.player.play("hero-idle");
          this.player.on("animationcomplete", (anim: { key: string }) => {
            if (anim.key !== "hero-idle") this.player.play("hero-idle");
          });

          this.boss = this.add.sprite(W * 0.78, H - 45, "boss").setOrigin(0.5, 1).setScale(0.55).setFlipX(true);
          this.boss.play("boss-idle");
          this.boss.on("animationcomplete", (anim: { key: string }) => {
            if (anim.key !== "boss-idle") this.boss.play("boss-idle");
          });

          // Boss idle float
          this.tweens.add({ targets: this.boss, y: this.boss.y - 10, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

          // Particles
          this.particles = this.add.particles(0, 0, "__DEFAULT", {
            speed: { min: 80, max: 200 }, scale: { start: 0.25, end: 0 },
            lifespan: 400, quantity: 0, tint: [0xffd700, 0xff8800, 0xffffff], blendMode: "ADD",
          });

          // Expose methods to parent via ref
          methodsRef.current = {
            playerAttack: () => {
              this.player.play("hero-attack");
              const origX = W * 0.22;
              this.tweens.add({ targets: this.player, x: origX + 90, duration: 180, ease: "Power2", yoyo: true, onComplete: () => { this.player.x = origX; } });
            },
            playerHurt: () => {
              this.player.play("hero-hurt");
              this.tweens.add({ targets: this.player, x: this.player.x - 12, duration: 60, yoyo: true, repeat: 3, ease: "Power1" });
              this.player.setTint(0xff4444);
              this.time.delayedCall(300, () => this.player.clearTint());
            },
            bossHurt: (damage: number) => {
              this.boss.play("boss-hurt");
              this.boss.setTint(0xffffff);
              this.time.delayedCall(120, () => this.boss.clearTint());
              const origX = this.boss.x;
              this.tweens.add({ targets: this.boss, x: origX + 20, duration: 50, yoyo: true, repeat: 3, ease: "Power1", onComplete: () => { this.boss.x = origX; } });
              if (this.particles) { this.particles.setPosition(this.boss.x, this.boss.y - 60); this.particles.explode(18); }
              if (damage > 0) {
                const txt = this.add.text(this.boss.x, this.boss.y - 80, `-${damage}`, {
                  fontSize: "28px", fontFamily: "monospace", color: "#fde047",
                  stroke: "#000000", strokeThickness: 4, fontStyle: "bold",
                }).setOrigin(0.5);
                this.tweens.add({ targets: txt, y: txt.y - 70, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 900, ease: "Power2", onComplete: () => txt.destroy() });
              }
            },
          };

          // Notify parent the scene is ready
          onReady?.({
            triggerPlayerAttack: () => methodsRef.current?.playerAttack(),
            triggerPlayerHurt:   () => methodsRef.current?.playerHurt(),
            triggerBossHurt:     (dmg) => methodsRef.current?.bossHurt(dmg),
          });
        }
      }

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width,
        height,
        transparent: true,
        parent: containerRef.current!,
        scene: [BattleScene],
        audio: { disableWebAudio: true },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        banner: false,
      });
    }

    init();

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      methodsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        // Checkerboard suppression: multiply blend makes grey/white invisible on dark bg
        mixBlendMode: "screen",
      }}
    />
  );
}
