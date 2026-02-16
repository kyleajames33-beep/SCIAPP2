'use client';

import { motion } from 'framer-motion';
import { Trophy, Gem } from 'lucide-react';

interface BossVictoryProps {
  gemsEarned: number;
  questionsAnswered: number;
  onContinue: () => void;
}

export function BossVictory({ gemsEarned, questionsAnswered, onContinue }: BossVictoryProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-2xl max-w-md w-full text-center"
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-4" />
        </motion.div>

        <h1 className="text-4xl font-bold text-white mb-2">BOSS DEFEATED!</h1>
        <p className="text-purple-200 mb-6">Your team conquered the challenge!</p>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gem className="w-6 h-6 text-cyan-400" />
            <span className="text-3xl font-bold text-cyan-400">+{gemsEarned}</span>
          </div>
          <p className="text-sm text-gray-300">Questions Answered: {questionsAnswered}</p>
        </div>

        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:scale-105 transition-transform"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
