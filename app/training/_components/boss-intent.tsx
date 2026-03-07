'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Sparkles, AlertTriangle, Flame, Zap, Droplets } from 'lucide-react';

export type BossIntent = {
  type: 'attack' | 'defend' | 'special';
  moveName: string;
  description: string;
  effect?: 'corrosion' | 'stun' | 'burn' | 'defense' | 'none';
  damage?: number;
};

interface BossIntentProps {
  intent: BossIntent | null;
  isVisible: boolean;
  bossName: string;
  themeColor?: string;
}

export function BossIntentDisplay({ intent, isVisible, bossName, themeColor = '#ef4444' }: BossIntentProps) {
  if (!intent || !isVisible) return null;

  const getIntentIcon = () => {
    switch (intent.type) {
      case 'attack':
        return <Sword className="w-6 h-6" />;
      case 'defend':
        return <Shield className="w-6 h-6" />;
      case 'special':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <AlertTriangle className="w-6 h-6" />;
    }
  };

  const getEffectIcon = () => {
    switch (intent.effect) {
      case 'burn':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'stun':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'corrosion':
        return <Droplets className="w-4 h-4 text-green-400" />;
      case 'defense':
        return <Shield className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getIntentColor = () => {
    switch (intent.type) {
      case 'attack':
        return 'from-red-600 to-red-800 border-red-500';
      case 'defend':
        return 'from-blue-600 to-blue-800 border-blue-500';
      case 'special':
        return 'from-purple-600 to-purple-800 border-purple-500';
      default:
        return 'from-gray-600 to-gray-800 border-gray-500';
    }
  };

  const getIntentLabel = () => {
    switch (intent.type) {
      case 'attack':
        return 'ATTACKING';
      case 'defend':
        return 'DEFENDING';
      case 'special':
        return 'SPECIAL MOVE';
      default:
        return 'PREPARING';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`relative bg-gradient-to-r ${getIntentColor()} border-2 rounded-xl p-3 shadow-lg`}
      >
        {/* Animated glow effect */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: `0 0 20px ${themeColor}40` }}
        />

        <div className="relative z-10">
          {/* Header with intent type */}
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              className="p-1.5 bg-black/30 rounded-lg"
            >
              {getIntentIcon()}
            </motion.div>
            <div>
              <p className="text-xs font-bold text-white/70 tracking-wider">
                {bossName} is {getIntentLabel()}
              </p>
              <p className="text-sm font-bold text-white">{intent.moveName}</p>
            </div>
          </div>

          {/* Description and effects */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-white/80 flex-1">{intent.description}</p>
            <div className="flex items-center gap-2">
              {intent.damage && intent.damage > 0 && (
                <span className="text-xs font-bold text-red-300 bg-red-900/50 px-2 py-0.5 rounded">
                  -{intent.damage} DMG
                </span>
              )}
              {getEffectIcon()}
            </div>
          </div>
        </div>

        {/* Pulsing warning indicator for attacks */}
        {intent.type === 'attack' && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
