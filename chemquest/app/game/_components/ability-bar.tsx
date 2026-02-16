'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, Snowflake, Gem } from 'lucide-react';

interface AbilityBarProps {
  gems: number;
  onUseAbility: (type: 'shield' | 'overdrive' | 'freeze') => void;
  activeAbilities: string[];
}

export function AbilityBar({ gems, onUseAbility, activeAbilities }: AbilityBarProps) {
  const abilities = [
    { id: 'shield', icon: Shield, cost: 20, color: 'bg-blue-500', label: 'Shield' },
    { id: 'overdrive', icon: Zap, cost: 50, color: 'bg-yellow-500', label: 'Overdrive' },
    { id: 'freeze', icon: Snowflake, cost: 40, color: 'bg-cyan-400', label: 'Freeze' },
  ];

  return (
    <div className="flex gap-4 justify-center mb-6">
      {abilities.map((ability) => {
        const isActive = activeAbilities.includes(ability.id);
        const canAfford = gems >= ability.cost;

        return (
          <motion.button
            key={ability.id}
            whileHover={canAfford ? { scale: 1.05 } : {}}
            whileTap={canAfford ? { scale: 0.95 } : {}}
            onClick={() => canAfford && onUseAbility(ability.id as any)}
            disabled={!canAfford || isActive}
            className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
              isActive 
                ? 'border-green-400 bg-green-900/20' 
                : canAfford 
                ? `border-white/20 ${ability.color}/20 hover:border-white/50` 
                : 'border-gray-700 bg-gray-900/50 opacity-50 grayscale'
            }`}
          >
            <ability.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-green-400' : 'text-white'}`} />
            <span className="text-[10px] font-bold uppercase">{ability.label}</span>
            
            <div className="mt-1 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
              <Gem className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-bold">{ability.cost}</span>
            </div>

            {isActive && (
              <motion.div 
                layoutId="active-glow"
                className="absolute -inset-1 border-2 border-green-400 rounded-xl animate-pulse"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
