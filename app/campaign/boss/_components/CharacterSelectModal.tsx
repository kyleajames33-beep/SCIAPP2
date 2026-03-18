"use client";

import { motion, AnimatePresence } from "framer-motion";
import { authFetch } from "@/lib/auth-fetch";
import type { Session } from "@supabase/supabase-js";

const CHARACTERS = [
  {
    id: "electron" as const,
    symbol: "e⁻",
    name: "Electron",
    tagline: "Tiny, fast, negatively charged. Never sits still.",
    archetype: "Offensive / Speed",
    color: "#3b82f6",
    bg: "from-blue-950/80 to-blue-900/40",
    border: "border-blue-500/60",
  },
  {
    id: "proton" as const,
    symbol: "p⁺",
    name: "Proton",
    tagline: "Heavy, positive, powerful. Slow but hits hard and takes hits harder.",
    archetype: "Defensive / Tank",
    color: "#ef4444",
    bg: "from-red-950/80 to-red-900/40",
    border: "border-red-500/60",
  },
  {
    id: "neutron" as const,
    symbol: "n⁰",
    name: "Neutron",
    tagline: "Neutral, mysterious, stabilising. No charge — but that's the power.",
    archetype: "Balanced / Support",
    color: "#22c55e",
    bg: "from-green-950/80 to-green-900/40",
    border: "border-green-500/60",
  },
] as const;

type CharacterId = "electron" | "proton" | "neutron";

interface Props {
  session: Session | null;
  onSelect: (choice: CharacterId) => void;
}

export default function CharacterSelectModal({ session, onSelect }: Props) {
  const handleSelect = async (choice: CharacterId) => {
    if (session) {
      await authFetch("/api/user/character", session, {
        method: "POST",
        body: JSON.stringify({ characterChoice: choice }),
      });
    }
    onSelect(choice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-4 text-center"
      >
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
          Choose Your Particle
        </h1>
        <p className="text-white/50 text-sm mb-8 font-mono">
          This choice persists through your entire journey. Choose wisely.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {CHARACTERS.map((char) => (
            <motion.button
              key={char.id}
              onClick={() => handleSelect(char.id)}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className={`bg-gradient-to-b ${char.bg} border ${char.border}
                rounded-xl p-5 text-left cursor-pointer transition-shadow
                hover:shadow-lg`}
              style={{ boxShadow: `0 0 0 0 ${char.color}` }}
            >
              <div className="text-4xl font-bold mb-3" style={{ color: char.color }}>
                {char.symbol}
              </div>
              <div className="text-white font-bold text-lg mb-1">{char.name}</div>
              <div className="text-white/60 text-xs leading-relaxed mb-3">
                {char.tagline}
              </div>
              <div
                className="text-xs font-mono font-bold px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: `${char.color}22`, color: char.color }}
              >
                {char.archetype}
              </div>
            </motion.button>
          ))}
        </div>

        <p className="text-white/25 text-xs mt-6 font-mono">
          Your particle evolves as you progress through modules.
        </p>
      </motion.div>
    </div>
  );
}