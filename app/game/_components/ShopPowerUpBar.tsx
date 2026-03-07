'use client';

import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';

interface ShopPowerUpBarProps {
  ownedItems: string[]; // e.g., ['shield', 'green', 'gold_hammer']
  isShielded: boolean;
  onActivateShield: () => void;
}

export function ShopPowerUpBar({ ownedItems, isShielded, onActivateShield }: ShopPowerUpBarProps) {
  const hasShield = ownedItems.includes('shield');

  if (!hasShield) return null;

  return (
    <div className="flex gap-3 justify-center mb-4">
      <motion.button
        whileHover={!isShielded ? { scale: 1.05 } : {}}
        whileTap={!isShielded ? { scale: 0.95 } : {}}
        onClick={onActivateShield}
        disabled={isShielded}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
          isShielded
            ? 'border-blue-400 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
            : 'border-white/20 bg-slate-800/50 hover:border-blue-400/50 hover:bg-blue-500/10'
        }`}
      >
        <div className={`p-1.5 rounded-lg ${isShielded ? 'bg-blue-500' : 'bg-slate-700'}`}>
          <Shield className={`w-5 h-5 ${isShielded ? 'text-white' : 'text-blue-400'}`} />
        </div>
        <div className="text-left">
          <div className={`text-sm font-bold ${isShielded ? 'text-blue-300' : 'text-white'}`}>
            {isShielded ? 'SHIELD ACTIVE' : 'ACTIVATE SHIELD'}
          </div>
          <div className="text-[10px] text-slate-400">
            {isShielded ? 'Blocks next wrong answer' : 'Click to protect yourself'}
          </div>
        </div>
        {isShielded && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
