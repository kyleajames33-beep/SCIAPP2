'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface CombatEffectsProps {
  effects: { id: number; text: string; type: 'damage' | 'heal' | 'crit'; x: number; y: number }[];
}

export function CombatEffects({ effects }: CombatEffectsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, y: effect.y, x: effect.x, scale: 0.5 }}
            animate={{ opacity: 1, y: effect.y - 100, scale: effect.type === 'crit' ? 1.5 : 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`absolute font-black text-2xl italic tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
              effect.type === 'damage' ? 'text-yellow-400' : 
              effect.type === 'crit' ? 'text-red-500 text-4xl' : 
              'text-green-400'
            }`}
          >
            {effect.text}
            {effect.type === 'crit' && <span className="block text-sm uppercase">CRITICAL!</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
