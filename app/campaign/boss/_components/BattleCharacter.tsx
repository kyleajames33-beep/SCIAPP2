"use client";

import { motion, AnimatePresence } from "framer-motion";

type CharacterState = "idle" | "attack" | "hurt";

interface Props {
  idleSrc: string;
  attackSrc: string;
  hurtSrc: string;
  state: CharacterState;
  flip?: boolean;       // true for boss (faces left)
  width?: number;
  height?: number;
  alt: string;
}

const MOVE: Record<CharacterState, object> = {
  idle:   { y: [0, -8, 0], transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" } },
  attack: { x: 55, transition: { duration: 0.15, ease: "easeOut" } },
  hurt:   { x: [-10, 10, -10, 10, 0], transition: { duration: 0.35, ease: "easeInOut" } },
};

export default function BattleCharacter({
  idleSrc, attackSrc, hurtSrc, state,
  flip = false, width = 160, height = 200, alt,
}: Props) {
  const src = state === "attack" ? attackSrc : state === "hurt" ? hurtSrc : idleSrc;

  return (
    <motion.div
      style={{
        width,
        height,
        transform: flip ? "scaleX(-1)" : undefined,
        position: "relative",
      }}
      animate={MOVE[state]}
    >
      <motion.img
        key={src}
        src={src}
        alt={alt}
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1, filter: state === "hurt" ? "brightness(2)" : "brightness(1)" }}
        transition={{ duration: 0.08 }}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </motion.div>
  );
}