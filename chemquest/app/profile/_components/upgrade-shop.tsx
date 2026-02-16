'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Coins, Clock, Sword, Lock } from 'lucide-react';

const UPGRADE_DATA = [
  { id: 'passive_income', name: 'Study Buddy', icon: TrendingUp, description: 'Earn coins passively every minute', baseCost: 100 },
  { id: 'streak_bonus', name: 'Focus Boost', icon: Zap, description: 'Extra coins for every streak milestone', baseCost: 250 },
  { id: 'coin_multiplier', name: 'Scholarship', icon: Coins, description: 'Multiplies all coin earnings', baseCost: 500 },
  { id: 'time_bonus', name: 'Time Warp', icon: Clock, description: 'Adds extra seconds to every question', baseCost: 300 },
  { id: 'boss_damage', name: 'Heavy Hitter', icon: Sword, description: 'Deal more damage to Bosses', baseCost: 400 },
];

export function UpgradeShop({ userCoins, userUpgrades, onPurchase }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {UPGRADE_DATA.map((upgrade) => {
        const currentLevel = userUpgrades[upgrade.id] || 0;
        const cost = Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel));
        const canAfford = userCoins >= cost;

        return (
          <motion.div 
            key={upgrade.id}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-900/50 rounded-lg">
                <upgrade.icon className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">{upgrade.name}</h3>
                <p className="text-xs text-gray-400">{upgrade.description}</p>
                <span className="text-xs font-mono text-purple-400">Level {currentLevel}</span>
              </div>
            </div>

            <button
              onClick={() => onPurchase(upgrade.id, cost)}
              disabled={!canAfford}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                canAfford 
                ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {cost} 🪙
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
