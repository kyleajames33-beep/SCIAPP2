'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BossHpBarProps {
  currentHp: number;
  maxHp: number;
  isEnraged: boolean;
  bossName?: string;
}

export function BossHpBar({ currentHp, maxHp, isEnraged, bossName = "Chemistry Boss" }: BossHpBarProps) {
  const [displayHp, setDisplayHp] = useState(currentHp);
  const hpPercentage = Math.max(0, (currentHp / maxHp) * 100);

  useEffect(() => {
    // Animate HP changes
    const timer = setTimeout(() => setDisplayHp(currentHp), 100);
    return () => clearTimeout(timer);
  }, [currentHp]);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      {/* Boss Name */}
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-2xl font-bold ${isEnraged ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
          {bossName}
          {isEnraged && <span className="ml-2 text-sm">🔥 ENRAGED</span>}
        </h2>
        <span className="text-lg font-mono">
          {displayHp} / {maxHp} HP
        </span>
      </div>

      {/* HP Bar Container */}
      <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden border-2 border-purple-500">
        {/* HP Bar Fill */}
        <motion.div
          className={`h-full ${isEnraged ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${hpPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Damage Flash Effect */}
        {currentHp < displayHp && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Heal Flash Effect */}
        {currentHp > displayHp && (
          <motion.div
            className="absolute inset-0 bg-green-400"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      {/* Enrage Warning */}
      {isEnraged && (
        <motion.div
          className="mt-2 text-center text-red-500 font-bold text-sm"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚠️ Boss heals 50 HP on wrong answers! ⚠️
        </motion.div>
      )}
    </div>
  );
}
