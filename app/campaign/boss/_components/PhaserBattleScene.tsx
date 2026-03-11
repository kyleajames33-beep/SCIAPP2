"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

export type BattleAction = "idle" | "attack" | "hurt";

export interface PhaserBattleSceneHandle {
  triggerPlayerAttack: () => void;
  triggerPlayerHurt: () => void;
  triggerBossHurt: (damage: number) => void;
  setBossSheet: (key: string) => void;
}

interface Props {
  bossSheetUrl: string;   // e.g. "/sprites/boss_atom_sheet.png"
  width?: number;
  height?: number;
}

// Frame layout — 4 columns × 3 rows
// Row 0: idle   (frames 0–3)
// Row 1: attack (frames 4–7)
// Row 2: hurt   (frames 8–11)
const FRAME_W = 256;
const FRAME_H = 256;

const PhaserBattleScene = forwardRef<PhaserBattleSceneHandle, Props>(
  function PhaserBattleScene({ bossSheetUrl, width = 600, height = 260 }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<import("phaser").Game | null>(null);
    const sceneRef = useRef<BattleScene | null>(null);

    useImperativeHandle(ref, () => ({
      triggerPlayerAttack: () => sceneRef.current?.playerAttack(),
      triggerPlayerHurt:   () => sceneRef.current?.playerHurt(),
      triggerBossHurt:     (dmg) => sceneRef.current?.bossHurt(dmg),
      setBossSheet:        (key) => sceneRef.current?.swapBoss(key),
    }));

    useEffect(() => {
      let game: import("phaser").Game;

      async function init() {
        const Phaser = (await import("phaser")).default;

        class BattleScene extends Phaser.Scene {
          private player!: Phaser.GameObjects.Sprite;
          private boss!: Phaser.GameObjects.Sprite;
          private bossSheetKey = "boss";
          private dmgText?: Phaser.GameObjects.Text;
          private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

          constructor() {
            super({ key: "BattleScene" });
          }

          preload() {
            this.load.spritesheet("hero", "/sprites/hero_sheet.png",  { frameWidth: FRAME_W, frameHeight: FRAME_H });
            this.load.spritesheet("boss", bossSheetUrl,               { frameWidth: FRAME_W, frameHeight: FRAME_H });
          }

          create() {
            sceneRef.current = this as unknown as BattleScene;

            const W = this.scale.width;
            const H = this.scale.height;

            // ── Ground line ──
            const ground = this.add.graphics();
            ground.lineStyle(1, 0x334155, 0.4);
            ground.lineBetween(0, H - 40, W, H - 40);
            ground.fillStyle(0x0f172a, 0.3);
            ground.fillRect(0, H - 40, W, 40);

            // ── Hero animations ──
            this.anims.create({ key: "hero-idle",   frames: this.anims.generateFrameNumbers("hero", { start: 0, end: 3 }), frameRate: 6,  repeat: -1 });
            this.anims.create({ key: "hero-attack", frames: this.anims.generateFrameNumbers("hero", { start: 4, end: 7 }), frameRate: 12, repeat: 0 });
            this.anims.create({ key: "hero-hurt",   frames: this.anims.generateFrameNumbers("hero", { start: 8, end: 11 }), frameRate: 10, repeat: 0 });

            // ── Boss animations ──
            this.anims.create({ key: "boss-idle",   frames: this.anims.generateFrameNumbers("boss", { start: 0, end: 3 }), frameRate: 5,  repeat: -1 });
            this.anims.create({ key: "boss-attack", frames: this.anims.generateFrameNumbers("boss", { start: 4, end: 7 }), frameRate: 10, repeat: 0 });
            this.anims.create({ key: "boss-hurt",   frames: this.anims.generateFrameNumbers("boss", { start: 8, end: 11 }), frameRate: 10, repeat: 0 });

            // ── Player sprite ──
            this.player = this.add.sprite(W * 0.22, H - 45, "hero")
              .setOrigin(0.5, 1)
              .setScale(0.55);
            this.player.play("hero-idle");

            // Return to idle after non-looping anims
            this.player.on("animationcomplete", (anim: { key: string }) => {
              if (anim.key !== "hero-idle") this.player.play("hero-idle");
            });

            // ── Boss sprite ──
            this.boss = this.add.sprite(W * 0.78, H - 45, "boss")
              .setOrigin(0.5, 1)
              .setScale(0.55)
              .setFlipX(true);
            this.boss.play("boss-idle");

            this.boss.on("animationcomplete", (anim: { key: string }) => {
              if (anim.key !== "boss-idle") this.boss.play("boss-idle");
            });

            // Gentle idle float tween for boss
            this.tweens.add({
              targets: this.boss,
              y: this.boss.y - 10,
              duration: 1800,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });

            // ── Hit particles (yellow sparks) ──
            this.particles = this.add.particles(0, 0, "__DEFAULT", {
              speed: { min: 80, max: 200 },
              scale: { start: 0.25, end: 0 },
              lifespan: 400,
              quantity: 0,
              tint: [0xffd700, 0xff8800, 0xffffff],
              blendMode: "ADD",
            });
          }

          playerAttack() {
            // Player lunges toward boss
            this.player.play("hero-attack");
            const origX = this.scale.width * 0.22;
            this.tweens.add({
              targets: this.player,
              x: origX + 90,
              duration: 180,
              ease: "Power2",
              yoyo: true,
              onComplete: () => { this.player.x = origX; },
            });

            // Delay boss hurt to match lunge timing
            this.time.delayedCall(200, () => this.bossHurt(0, false));
          }

          playerHurt() {
            this.player.play("hero-hurt");
            // Shake player
            this.tweens.add({
              targets: this.player,
              x: this.player.x - 12,
              duration: 60,
              yoyo: true,
              repeat: 3,
              ease: "Power1",
            });
            // Red flash tint
            this.player.setTint(0xff4444);
            this.time.delayedCall(300, () => this.player.clearTint());
          }

          bossHurt(damage = 0, playAnim = true) {
            if (playAnim) this.boss.play("boss-hurt");

            // Flash white
            this.boss.setTint(0xffffff);
            this.time.delayedCall(120, () => this.boss.clearTint());

            // Recoil shake
            const origX = this.boss.x;
            this.tweens.add({
              targets: this.boss,
              x: origX + 20,
              duration: 50,
              yoyo: true,
              repeat: 3,
              ease: "Power1",
              onComplete: () => { this.boss.x = origX; },
            });

            // Burst particles at boss position
            if (this.particles) {
              this.particles.setPosition(this.boss.x, this.boss.y - 60);
              this.particles.explode(18);
            }

            // Floating damage number
            if (damage > 0) {
              const txt = this.add.text(this.boss.x, this.boss.y - 80, `-${damage}`, {
                fontSize: "28px",
                fontFamily: "monospace",
                color: "#fde047",
                stroke: "#000000",
                strokeThickness: 4,
                fontStyle: "bold",
              }).setOrigin(0.5);

              this.tweens.add({
                targets: txt,
                y: txt.y - 70,
                alpha: 0,
                scaleX: 1.6,
                scaleY: 1.6,
                duration: 900,
                ease: "Power2",
                onComplete: () => txt.destroy(),
              });
            }
          }

          swapBoss(key: string) {
            this.bossSheetKey = key;
            this.boss.setTexture(key);
            this.boss.play(`${key}-idle`);
          }
        }

        game = new Phaser.Game({
          type: Phaser.AUTO,
          width,
          height,
          backgroundColor: "transparent",
          transparent: true,
          parent: containerRef.current!,
          scene: [BattleScene],
          audio: { disableWebAudio: true },
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          // Remove Phaser banner from console
          banner: false,
        });

        gameRef.current = game;
      }

      init();

      return () => {
        gameRef.current?.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div
        ref={containerRef}
        style={{ width, height }}
        // mix-blend-mode multiply makes white bg invisible on dark surfaces
        className="[&_canvas]:mix-blend-mode-multiply"
      />
    );
  }
);

export default PhaserBattleScene;
