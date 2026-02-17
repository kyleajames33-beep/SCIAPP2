'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface RankInfo {
  name: string;
  symbol: string;
  gradient: string;
}

interface RankUpCelebrationProps {
  previousRank: RankInfo;
  newRank: RankInfo;
  onComplete: () => void;
}

export function RankUpCelebration({ previousRank, newRank, onComplete }: RankUpCelebrationProps) {
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
        return;
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
        zIndex: 100,
      });
    }, 250);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="text-center p-10 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-yellow-500/50 shadow-2xl max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-6xl mb-4"
          >
            {newRank.symbol}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-sm text-yellow-400 font-bold uppercase tracking-widest mb-2">
              Rank Up!
            </div>
            <div className="text-gray-400 text-sm mb-1">
              {previousRank.name} → {newRank.name}
            </div>
            <div className={`text-4xl font-bold bg-gradient-to-r ${newRank.gradient} bg-clip-text text-transparent`}>
              {newRank.name}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onComplete}
            className="mt-6 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full text-sm transition-colors"
          >
            Continue
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
