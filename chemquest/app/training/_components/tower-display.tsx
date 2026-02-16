'use client';

import { motion } from 'framer-motion';
import { ChevronUp, Heart, Trophy, Gem } from 'lucide-react';

interface TowerDisplayProps {
  currentFloor: number;
  lives: number;
  maxLives: number;
  gemsCollected: number;
}

export function TowerDisplay({ currentFloor, lives, maxLives, gemsCollected }: TowerDisplayProps) {
  return (
    <div className="flex flex-col items-center mb-8 w-full max-w-md mx-auto">
      {/* Tower Progress Visual */}
      <div className="relative w-full h-24 bg-gray-900 rounded-xl border-2 border-blue-500/30 overflow-hidden mb-4 flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <div className="flex flex-col items-center z-10">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronUp className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            FLOOR {currentFloor}
          </h2>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between w-full gap-4">
        {/* Lives */}
        <div className="flex-1 bg-gray-800/50 p-3 rounded-lg border border-red-500/30 flex items-center justify-center gap-2">
          <div className="flex gap-1">
            {[...Array(maxLives)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} 
              />
            ))}
          </div>
        </div>

        {/* Gems */}
        <div className="flex-1 bg-gray-800/50 p-3 rounded-lg border border-cyan-500/30 flex items-center justify-center gap-2">
          <Gem className="w-5 h-5 text-cyan-400" />
          <span className="font-bold text-cyan-400">{gemsCollected}</span>
        </div>
      </div>
    </div>
  );
}
