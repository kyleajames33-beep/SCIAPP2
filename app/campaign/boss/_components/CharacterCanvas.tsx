"use client";

import { useEffect, useRef, useCallback } from "react";

export type CharacterState = "idle" | "attack" | "hurt";

interface CharacterCanvasProps {
  state: CharacterState;
  facing?: "right" | "left";
  width?: number;
  height?: number;
  color?: string;       // skin/body accent color
  className?: string;
}

interface FrameData {
  t: number;            // elapsed ms within the animation
  duration: number;     // total loop duration ms
  progress: number;     // 0–1 within the loop
}

// ─── drawing helpers ────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOut(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function drawOval(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  rx: number, ry: number,
  fill: string,
  stroke = "rgba(0,0,0,0.4)",
  lineWidth = 1.5
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  thickness: number,
  fill: string
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const len = Math.sqrt(dx * dx + dy * dy);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.roundRect(0, -thickness / 2, len, thickness, thickness / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

// ─── per-state frame calculations ───────────────────────────────────────────

function getIdleFrame(p: number) {
  const bob = Math.sin(p * Math.PI * 2) * 3;            // gentle up-down bob
  const breathe = Math.sin(p * Math.PI * 2) * 1.5;     // torso breathe
  const armSwing = Math.sin(p * Math.PI * 2) * 0.18;   // arm sway
  return { offsetY: bob, breathe, armSwing, leanX: 0, squashY: 1, squashX: 1 };
}

function getAttackFrame(p: number) {
  // 0–0.3 wind-up (lean back), 0.3–0.6 lunge forward, 0.6–1.0 snap back
  let offsetX = 0, leanX = 0, armSwing = 0, squashX = 1, squashY = 1;

  if (p < 0.3) {
    const t = p / 0.3;
    offsetX = lerp(0, -8, easeOut(t));
    leanX = lerp(0, -0.15, t);
    armSwing = lerp(0, -0.6, t);
  } else if (p < 0.6) {
    const t = (p - 0.3) / 0.3;
    offsetX = lerp(-8, 28, easeOut(t));
    leanX = lerp(-0.15, 0.3, t);
    armSwing = lerp(-0.6, 1.2, easeOut(t));
    squashX = lerp(1, 1.15, easeOut(t));
    squashY = lerp(1, 0.88, easeOut(t));
  } else {
    const t = (p - 0.6) / 0.4;
    offsetX = lerp(28, 0, easeInOut(t));
    leanX = lerp(0.3, 0, t);
    armSwing = lerp(1.2, 0, easeInOut(t));
  }

  return { offsetY: 0, breathe: 0, armSwing, leanX, squashY, squashX, offsetX };
}

function getHurtFrame(p: number) {
  // snap back fast, then wobble
  const snap = p < 0.15 ? lerp(0, -20, p / 0.15) : lerp(-20, 0, easeInOut((p - 0.15) / 0.85));
  const wobble = p > 0.15 ? Math.sin(p * Math.PI * 6) * (1 - p) * 8 : 0;
  const leanX = p < 0.15 ? lerp(0, -0.35, p / 0.15) : lerp(-0.35, 0, (p - 0.15) / 0.85);
  const flash = p < 0.25 ? 1 - p / 0.25 : 0; // red flash alpha
  return { offsetY: 0, breathe: 0, armSwing: leanX * 0.5, leanX, squashY: 1, squashX: 1, offsetX: snap + wobble, flash };
}

// ─── main draw function ──────────────────────────────────────────────────────

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  facing: "right" | "left",
  state: CharacterState,
  frame: FrameData,
  color: string
) {
  const p = frame.progress;

  let offsetX = 0, offsetY = 0, breathe = 0, armSwing = 0;
  let leanX = 0, squashY = 1, squashX = 1, flash = 0;

  if (state === "idle") {
    const f = getIdleFrame(p);
    offsetY = f.offsetY; breathe = f.breathe; armSwing = f.armSwing; leanX = f.leanX;
    squashY = f.squashY; squashX = f.squashX;
  } else if (state === "attack") {
    const f = getAttackFrame(p);
    offsetX = (f.offsetX ?? 0) * (facing === "right" ? 1 : -1);
    offsetY = f.offsetY; breathe = f.breathe; armSwing = f.armSwing;
    leanX = f.leanX * (facing === "right" ? 1 : -1);
    squashY = f.squashY; squashX = f.squashX;
  } else {
    const f = getHurtFrame(p);
    offsetX = (f.offsetX ?? 0) * (facing === "right" ? -1 : 1);
    offsetY = f.offsetY; breathe = f.breathe; armSwing = f.armSwing;
    leanX = f.leanX * (facing === "right" ? -1 : 1);
    squashY = f.squashY; squashX = f.squashX; flash = f.flash ?? 0;
  }

  const dir = facing === "right" ? 1 : -1;

  ctx.save();
  ctx.translate(cx + offsetX, cy + offsetY);
  ctx.scale(squashX, squashY);

  // lean (skew body slightly)
  ctx.transform(1, 0, leanX, 1, 0, 0);

  // ── shadow ──
  ctx.save();
  ctx.scale(1, 0.3);
  const shadowAlpha = 0.25 - Math.abs(offsetY) * 0.008;
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath();
  ctx.ellipse(0, 68, 22 * squashX, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── legs ──
  const legSpread = 10 + Math.abs(Math.sin(armSwing)) * 4;
  const legBend = state === "attack" && p > 0.3 && p < 0.6 ? 8 : 0;

  // back leg
  drawLimb(ctx, -5 * dir, 28, -legSpread * dir - legBend, 60, 10, "#4a5568");
  // front leg
  drawLimb(ctx, 5 * dir, 28, legSpread * dir + legBend, 60, 10, "#718096");

  // feet
  drawOval(ctx, -legSpread * dir - legBend, 63, 10, 5, "#2d3748");
  drawOval(ctx, legSpread * dir + legBend, 63, 10, 5, "#4a5568");

  // ── torso ──
  const torsoH = 26 + breathe;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-13, -2, 26, torsoH, 6);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // torso highlight
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-9, 0, 8, torsoH - 4, 4);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fill();
  ctx.restore();

  // ── arms ──
  const elbowAngle = armSwing;
  const shoulderY = 4;

  if (state === "attack") {
    // punching arm (front)
    const punchReach = p > 0.3 && p < 0.6 ? lerp(0, 30, (p - 0.3) / 0.3) : 0;
    drawLimb(ctx, 10 * dir, shoulderY, (24 + punchReach) * dir, shoulderY + 6, 9, color);
    // fist
    drawOval(ctx, (24 + punchReach) * dir, shoulderY + 6, 8, 7, "#e2e8f0");
    // back arm hanging
    drawLimb(ctx, -10 * dir, shoulderY, -16 * dir, shoulderY + 18, 8, color);
  } else {
    // idle/hurt — both arms with swing
    const armY = 18 + Math.sin(elbowAngle) * 4;
    drawLimb(ctx, -10 * dir, shoulderY, (-18 - elbowAngle * 8) * dir, armY, 8, color);
    drawLimb(ctx, 10 * dir, shoulderY, (18 + elbowAngle * 8) * dir, armY, 8, color);
    // hands
    drawOval(ctx, (-18 - elbowAngle * 8) * dir, armY, 6, 5, "#e2e8f0");
    drawOval(ctx, (18 + elbowAngle * 8) * dir, armY, 6, 5, "#e2e8f0");
  }

  // ── neck ──
  drawLimb(ctx, -3, -2, -3, -12, 8, "#e2e8f0");

  // ── head ──
  const headBob = state === "idle" ? Math.sin(p * Math.PI * 2) * 1 : 0;
  drawOval(ctx, 0, -24 + headBob, 16, 17, "#f7fafc", "rgba(0,0,0,0.25)", 1.5);

  // eyes
  const eyeX = 6 * dir;
  const blinkH = state === "hurt" && p < 0.3 ? lerp(4, 1, p / 0.3) : 4;
  drawOval(ctx, eyeX, -26 + headBob, 4, blinkH, "#1a202c");
  drawOval(ctx, eyeX + 1.5 * dir, -27 + headBob, 1.5, 1.5, "white"); // eye shine

  // expression
  if (state === "hurt") {
    ctx.beginPath();
    ctx.arc(eyeX, -20 + headBob, 4, 0, Math.PI, false); // frown
    ctx.strokeStyle = "#1a202c";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (state === "attack" && p > 0.3 && p < 0.65) {
    ctx.beginPath();
    ctx.arc(eyeX, -19 + headBob, 5, Math.PI, 0, false); // grin
    ctx.strokeStyle = "#1a202c";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(eyeX, -19 + headBob, 3, 0, Math.PI, false); // neutral smile
    ctx.strokeStyle = "#1a202c";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // hair
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -37 + headBob, 14, 8, 0, Math.PI, 0);
  ctx.fillStyle = "#2d3748";
  ctx.fill();
  ctx.restore();

  // ── hurt flash overlay ──
  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash * 0.6;
    ctx.beginPath();
    ctx.roundRect(-16, -45, 32, 110, 8);
    ctx.fillStyle = "#ff4444";
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── component ───────────────────────────────────────────────────────────────

const DURATIONS: Record<CharacterState, number> = {
  idle: 2400,
  attack: 600,
  hurt: 700,
};

export function CharacterCanvas({
  state,
  facing = "right",
  width = 120,
  height = 160,
  color = "#4299e1",
  className = "",
}: CharacterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const stateRef = useRef(state);
  const colorRef = useRef(color);
  const facingRef = useRef(facing);

  // keep refs in sync without restarting the loop
  stateRef.current = state;
  colorRef.current = color;
  facingRef.current = facing;

  const draw = useCallback((ts: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentState = stateRef.current;
    const duration = DURATIONS[currentState];
    const elapsed = ts - startRef.current;
    const t = elapsed % duration;
    const progress = t / duration;

    const frame: FrameData = { t, duration, progress };

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 8;

    drawCharacter(ctx, cx, cy, facingRef.current, currentState, frame, colorRef.current);

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // reset timer when state changes so attack/hurt start fresh
  useEffect(() => {
    startRef.current = performance.now();
  }, [state]);

  useEffect(() => {
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
