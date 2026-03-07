'use client';

import { motion } from 'framer-motion';
import { Trophy, Target, Coins, Zap, ArrowRight, Home } from 'lucide-react';
import Link from 'next/link';

interface GameSummaryProps {
  stats: {
    accuracy: number;
    coinsEarned: number;
    maxStreak: number;
    bossDefeated: boolean;
  };
  onRestart: () => void;
}

export function GameSummary({ stats, onRestart }: GameSummaryProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
    >
      <div className="bg-slate-900 border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)] rounded-3xl p-8 max-w-md w-full text-center">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", damping: 10 }}
        >
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-4xl font-black text-white italic mb-2">
            {stats.bossDefeated ? 'VICTORY!' : 'GAME OVER'}
          </h2>
          <p className="text-indigo-300 font-bold mb-8">Battle Results</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 p-4 rounded-2xl border-2 border-white/5">
            <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-black text-white">{stats.accuracy}%</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl border-2 border-white/5">
            <Coins className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-2xl font-black text-white">+{stats.coinsEarned}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Coins</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl border-2 border-white/5 col-span-2">
            <Zap className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-2xl font-black text-white">{stats.maxStreak}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Best Streak</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onRestart}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-[0_4px_0_rgb(67,56,202)] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
          >
            PLAY AGAIN <ArrowRight className="w-5 h-5" />
          </button>
          <Link 
            href="/dashboard"
            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> BACK TO HUB
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
