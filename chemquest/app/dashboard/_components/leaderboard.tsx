'use client';

import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatarConfig: {
    body: string;
    hair: string;
    weapon: string;
  };
}

export function Leaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="bg-slate-900 rounded-3xl border-4 border-indigo-500/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-black text-white italic flex items-center gap-2">
          <Trophy className="text-yellow-500" /> HALL OF FAME
        </h3>
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Global Rankings</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const isTop3 = index < 3;
          const avatarUrl = `/sprites/player_${entry.avatarConfig.body}_${entry.avatarConfig.hair}_${entry.avatarConfig.weapon}.png`;

          return (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              key={entry.id}
              className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : 
                index === 1 ? 'bg-slate-300/10 border-slate-400/50' :
                index === 2 ? 'bg-orange-500/10 border-orange-600/50' :
                'bg-slate-800/50 border-white/5'
              }`}
            >
              {/* Rank Badge */}
              <div className="w-8 text-center font-black text-xl text-indigo-300">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
              </div>

              {/* Mini Avatar Preview */}
              <div className="w-12 h-12 bg-slate-950 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center">
                <img src={avatarUrl} className="w-10 h-10 object-contain" alt="Player" />
              </div>

              {/* Player Info */}
              <div className="flex-1">
                <div className="font-black text-white uppercase text-sm tracking-tight">{entry.name}</div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase">Master Alchemist</div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-black text-white">{entry.score.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total XP</div>
              </div>

              {isTop3 && (
                <motion.div 
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl pointer-events-none" 
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
