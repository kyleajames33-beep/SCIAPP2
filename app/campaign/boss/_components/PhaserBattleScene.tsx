"use client";

import { useEffect, useRef } from "react";

export interface PhaserBattleSceneHandle {
  triggerBossHurt: (damage: number) => void;
}

interface Props {
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
  width = 600,
  height = 260,
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  // store scene methods so parent can call them via the handle
  const methodsRef = useRef<{
    bossHurt: (dmg: number) => void;
  } | null>(null);

  useEffect(() => {
    let destroyed = false;

    async function init() {
      const Phaser = (await import("phaser")).default;
      if (destroyed || gameRef.current) return; // React StrictMode mounts twice — bail if already cleaned up

      class BattleScene extends Phaser.Scene {
        private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

        constructor() { super({ key: "BattleScene" }); }

        preload() {
          // No sprites loaded — only particles and effects
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

          // No animations — sprites handled by Framer Motion

          // No sprites — handled by Framer Motion components

          // Particles
          this.particles = this.add.particles(0, 0, "__DEFAULT", {
            speed: { min: 80, max: 200 }, scale: { start: 0.25, end: 0 },
            lifespan: 400, quantity: 0, tint: [0xffd700, 0xff8800, 0xffffff], blendMode: "ADD",
          });

          // Expose methods to parent via ref
          methodsRef.current = {
            bossHurt: (damage: number) => {
              // Particles and damage number only — boss sprite handled by Framer Motion
              if (this.particles) { 
                this.particles.setPosition(W * 0.78, H - 120); // hardcoded boss position
                this.particles.explode(18); 
              }
              if (damage > 0) {
                const txt = this.add.text(W * 0.78, H - 140, `-${damage}`, {
                  fontSize: "28px", fontFamily: "monospace", color: "#fde047",
                  stroke: "#000000", strokeThickness: 4, fontStyle: "bold",
                }).setOrigin(0.5);
                this.tweens.add({ targets: txt, y: txt.y - 70, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 900, ease: "Power2", onComplete: () => txt.destroy() });
              }
            },
          };

          // Notify parent the scene is ready
          onReady?.({
            triggerBossHurt: (dmg) => methodsRef.current?.bossHurt(dmg),
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
      destroyed = true;
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
      }}
    />
  );
}
