'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Droplets, Shield, Clock } from 'lucide-react';

export type StatusEffectType = 'corrosion' | 'stun' | 'burn';

export type StatusEffect = {
  id: string;
  type: StatusEffectType;
  turnsRemaining: number;
  intensity: number; // 1-3 for visual intensity
};

interface StatusEffectsBarProps {
  effects: StatusEffect[];
  onEffectExpire?: (effectId: string) => void;
}

export function StatusEffectsBar({ effects, onEffectExpire }: StatusEffectsBarProps) {
  if (effects.length === 0) return null;

  const getEffectConfig = (type: StatusEffectType) => {
    switch (type) {
      case 'corrosion':
        return {
          icon: Droplets,
          color: 'from-green-500 to-emerald-600',
          bgColor: 'bg-green-900/50',
          borderColor: 'border-green-500',
          glowColor: 'rgba(16, 185, 129, 0.5)',
          name: 'Corrosion',
          description: 'Defense reduced, energy gain -25%',
        };
      case 'stun':
        return {
          icon: Zap,
          color: 'from-yellow-400 to-amber-500',
          bgColor: 'bg-yellow-900/50',
          borderColor: 'border-yellow-500',
          glowColor: 'rgba(234, 179, 8, 0.5)',
          name: 'Stun',
          description: 'Next turn skipped or delayed',
        };
      case 'burn':
        return {
          icon: Flame,
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-900/50',
          borderColor: 'border-orange-500',
          glowColor: 'rgba(249, 115, 22, 0.5)',
          name: 'Burn',
          description: 'Taking damage over time',
        };
      default:
        return {
          icon: Shield,
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-900/50',
          borderColor: 'border-gray-500',
          glowColor: 'rgba(107, 114, 128, 0.5)',
          name: 'Unknown',
          description: 'Unknown effect',
        };
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <AnimatePresence mode="popLayout">
        {effects.map((effect) => {
          const config = getEffectConfig(effect.type);
          const IconComponent = config.icon;

          return (
            <motion.div
              key={effect.id}
              initial={{ opacity: 0, scale: 0, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`relative flex items-center gap-1.5 px-2 py-1 rounded-lg border ${config.borderColor} ${config.bgColor}`}
              style={{ boxShadow: `0 0 10px ${config.glowColor}` }}
            >
              {/* Animated icon */}
              <motion.div
                animate={
                  effect.type === 'burn'
                    ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
                    : effect.type === 'stun'
                    ? { rotate: [0, 15, -15, 0] }
                    : { y: [0, -2, 0] }
                }
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
              >
                <IconComponent className={`w-4 h-4 bg-gradient-to-r ${config.color} bg-clip-text`} 
                  style={{ color: effect.type === 'burn' ? '#f97316' : effect.type === 'stun' ? '#eab308' : '#10b981' }}
                />
              </motion.div>

              {/* Effect name */}
              <span className="text-xs font-bold text-white">{config.name}</span>

              {/* Turns remaining badge */}
              <div className="flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3 text-white/70" />
                <span className="text-xs font-bold text-white">{effect.turnsRemaining}</span>
              </div>

              {/* Intensity indicators */}
              <div className="flex gap-0.5">
                {[1, 2, 3].map((level) => (
                  <motion.div
                    key={level}
                    className={`w-1.5 h-1.5 rounded-full ${level <= effect.intensity ? 'bg-white' : 'bg-white/30'}`}
                    animate={level <= effect.intensity ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, delay: level * 0.1 }}
                  />
                ))}
              </div>

              {/* Pulsing glow effect */}
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ boxShadow: `inset 0 0 10px ${config.glowColor}` }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Visual overlay effect for the battle arena when status effects are active
interface StatusEffectOverlayProps {
  activeEffects: StatusEffect[];
}

export function StatusEffectOverlay({ activeEffects }: StatusEffectOverlayProps) {
  const hasBurn = activeEffects.some((e) => e.type === 'burn');
  const hasCorrosion = activeEffects.some((e) => e.type === 'corrosion');
  const hasStun = activeEffects.some((e) => e.type === 'stun');

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Burn effect - fire particles rising */}
      <AnimatePresence>
        {hasBurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Fire gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-orange-500/20 to-transparent" />
            
            {/* Fire particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: '10%',
                  background: 'radial-gradient(circle, #f97316 0%, #ef4444 50%, transparent 70%)',
                }}
                animate={{
                  y: [0, -100, -150],
                  opacity: [0.8, 0.5, 0],
                  scale: [1, 0.8, 0.3],
                }}
                transition={{
                  duration: 1.5 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corrosion effect - dripping acid */}
      <AnimatePresence>
        {hasCorrosion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Acid gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-green-500/15 to-transparent" />
            
            {/* Dripping particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`acid-${i}`}
                className="absolute w-2 h-6 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: '5%',
                  background: 'linear-gradient(to bottom, #10b981, #059669)',
                }}
                animate={{
                  y: [0, 150, 200],
                  opacity: [0.7, 0.5, 0],
                  scaleY: [1, 1.5, 0.5],
                }}
                transition={{
                  duration: 2 + Math.random() * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeIn',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stun effect - electric sparks */}
      <AnimatePresence>
        {hasStun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Electric flash overlay */}
            <motion.div
              className="absolute inset-0 bg-yellow-400/10"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
            
            {/* Lightning bolts */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${20 + (i % 2) * 30}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              >
                <Zap className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
