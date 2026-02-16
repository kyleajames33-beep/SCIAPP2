'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mountain, Cloud } from 'lucide-react';
import { ElementalParticles, ElementalType } from './elemental-particles';
import { StatusEffectOverlay, StatusEffect } from './status-effects';

interface EnhancedBattleArenaProps {
  bossHp: number;
  bossMaxHp: number;
  isEnraged: boolean;
  lastAction: 'attack' | 'miss' | 'block' | null;
  playerStreak: number;
  totalQuestionsAnswered: number;
  subject?: string;
  playerSpriteUrl?: string;
  elementalType?: ElementalType;
  activeStatusEffects?: StatusEffect[];
  isCriticalHit?: boolean;
  bossSprite?: string;
  themeColor?: string;
}

export function EnhancedBattleArena({
  bossHp,
  bossMaxHp,
  isEnraged,
  lastAction,
  playerStreak,
  totalQuestionsAnswered,
  subject = 'chemistry',
  playerSpriteUrl = '/sprites/player_strong_idle.png',
  elementalType = 'Acid-Base',
  activeStatusEffects = [],
  isCriticalHit = false,
  bossSprite,
  themeColor,
}: EnhancedBattleArenaProps) {
  const hpPercent = (bossHp / bossMaxHp) * 100;

  // Determine player sprite based on action state
  const baseSpritePath = playerSpriteUrl.replace(/_(idle|attack|hurt)\.png$/, '');
  const getPlayerSprite = () => {
    switch (lastAction) {
      case 'attack':
        return `${baseSpritePath}_attack.png`;
      case 'miss':
        return `${baseSpritePath}_hurt.png`;
      case 'block':
      case null:
      default:
        return `${baseSpritePath}_idle.png`;
    }
  };

  const isPhase2 = hpPercent <= 60 && hpPercent > 25;
  const isPhase3 = hpPercent <= 25;

  // Dynamic particle colors based on boss elemental type and phase
  const getParticleColors = () => {
    if (isPhase3) {
      return ['#ef4444', '#dc2626', '#f87171', '#fca5a5', '#b91c1c', '#991b1b', '#fee2e2', '#fecaca'];
    }
    if (isPhase2) {
      return ['#f97316', '#ea580c', '#fb923c', '#fdba74', '#c2410c', '#9a3412', '#fed7aa', '#ffedd5'];
    }
    // Use theme color or default
    return ['#6366f1', '#4f46e5', '#818cf8', '#a5b4fc', '#4338ca', '#3730a3', '#c7d2fe', '#e0e7ff'];
  };

  const particleColors = getParticleColors();

  // Hit particles
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const distance = 60 + (i % 3) * 30;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 6 + (i % 3) * 4,
      color: particleColors[i],
    };
  });

  const distance = totalQuestionsAnswered * 50;
  const isSpeeding = playerStreak >= 5;
  const speedDuration = isSpeeding ? 0.25 : 0.5;

  // Determine boss sprite
  const finalBossSprite = bossSprite || `/sprites/${subject.toLowerCase()}_boss.png`;

  return (
    <motion.div
      animate={{
        borderColor: isPhase3 ? '#ff0000' : isPhase2 ? '#f97316' : themeColor || '#6366f1',
        boxShadow: isPhase3 ? '0 0 50px rgba(255,0,0,0.3)' : '0 0 20px rgba(0,0,0,0.2)',
      }}
      className={`relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border-4 shadow-2xl transition-colors duration-1000 flex-shrink-0 ${
        isCriticalHit ? 'animate-critical-flash' : ''
      }`}
    >
      {/* ELEMENTAL PARTICLES LAYER */}
      <ElementalParticles
        elementalType={elementalType}
        isActive={true}
        intensity={isPhase3 ? 'high' : isPhase2 ? 'medium' : 'low'}
      />

      {/* STATUS EFFECT OVERLAY */}
      <StatusEffectOverlay activeEffects={activeStatusEffects} />

      {/* BACKGROUND: Changes per phase */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: isPhase3
            ? 'radial-gradient(circle, #450a0a 0%, #000000 100%)'
            : isPhase2
            ? 'radial-gradient(circle, #7c2d12 0%, #020617 100%)'
            : 'radial-gradient(circle, #1e1b4b 0%, #020617 100%)',
        }}
      />

      {/* PHASE 3 SCREEN SHAKE */}
      {isPhase3 && (
        <motion.div
          animate={{ x: [-1, 1, -1], y: [1, -1, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="absolute inset-0 pointer-events-none border-4 border-red-600/20 z-50"
        />
      )}

      {/* LAYER 1: Far Background (Mountains) */}
      <motion.div
        animate={{ x: -(distance * 0.1) % 1000 }}
        className="absolute inset-0 opacity-20 flex items-end gap-20 px-10"
      >
        {[...Array(10)].map((_, i) => (
          <Mountain key={i} className="w-64 h-64 text-indigo-900" />
        ))}
      </motion.div>

      {/* LAYER 2: Mid Background (Trees/Clouds) */}
      <motion.div
        animate={{ x: -(distance * 0.5) % 1000 }}
        className="absolute inset-0 opacity-10 flex items-center gap-40"
      >
        {[...Array(10)].map((_, i) => (
          <Cloud key={i} className="w-32 h-32 text-white" />
        ))}
      </motion.div>

      {/* LAYER 3: The Moving Floor */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-indigo-900/40 to-transparent overflow-hidden">
        <motion.div
          animate={{ x: [-100, 0] }}
          transition={{ duration: speedDuration, repeat: Infinity, ease: 'linear' }}
          className={`flex gap-10 ${isSpeeding ? 'opacity-50' : 'opacity-30'}`}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full mt-20 ${
                isSpeeding ? 'w-32 bg-cyan-400/40' : 'w-20 bg-white/20'
              }`}
            />
          ))}
        </motion.div>

        {isSpeeding && (
          <motion.div
            animate={{ x: [-150, 0] }}
            transition={{ duration: speedDuration * 0.5, repeat: Infinity, ease: 'linear' }}
            className="flex gap-6 opacity-40 absolute top-10"
          >
            {[...Array(25)].map((_, i) => (
              <div key={i} className="w-16 h-0.5 bg-cyan-300/60 rounded-full" />
            ))}
          </motion.div>
        )}
      </div>

      {/* MAIN ARENA CONTENT */}
      <div className="flex justify-between items-end h-full px-20 pb-16 relative z-10">
        {/* PLAYER */}
        <motion.div
          animate={
            lastAction === 'attack' ? { x: [0, 200, 0], scale: [1, 1.2, 1] } : { y: [0, -5, 0] }
          }
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <motion.img
              key={lastAction || 'idle'}
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
              src={getPlayerSprite()}
              alt="Player"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          {playerStreak >= 3 && (
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute -inset-4 bg-cyan-400 rounded-full blur-xl -z-10 opacity-40"
            />
          )}
        </motion.div>

        {/* BOSS */}
        <motion.div
          key={lastAction || 'idle'}
          animate={
            lastAction === 'attack'
              ? {
                  x: [0, -10, 10, -10, 10, 0],
                  filter: [
                    'brightness(1)',
                    'brightness(2.5)',
                    'brightness(1)',
                    'brightness(2)',
                    'brightness(1)',
                  ],
                }
              : lastAction === 'miss'
              ? { x: [0, -50, 0], scale: [1, 1.2, 1] }
              : {}
          }
          transition={
            lastAction === 'attack'
              ? { duration: 0.4, ease: 'easeInOut' }
              : lastAction === 'miss'
              ? { duration: 0.5, ease: 'easeInOut' }
              : {}
          }
          className="relative"
        >
          <motion.div
            animate={
              isPhase3
                ? { y: [0, -15, 0], scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
                : { y: [0, -15, 0], scale: [1, 1.02, 1] }
            }
            transition={{ duration: isPhase3 ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              animate={{
                scale: isPhase3 ? 1.3 : isPhase2 ? 1.15 : 1,
                filter: isPhase3
                  ? 'brightness(1.2) contrast(1.1)'
                  : isPhase2
                  ? 'brightness(1.1) contrast(1.05)'
                  : 'none',
              }}
              className="relative w-56 h-56 flex items-center justify-center"
            >
              <img
                src={finalBossSprite}
                alt="Boss"
                className="w-full h-full object-contain drop-shadow-2xl"
              />

              {isPhase3 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute inset-0 bg-red-600 rounded-full blur-3xl -z-10"
                />
              )}
              {isPhase2 && !isPhase3 && (
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 bg-orange-500 rounded-full blur-3xl -z-10"
                />
              )}
            </motion.div>
          </motion.div>

          {/* Phase Label */}
          <AnimatePresence>
            {isPhase3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-black px-4 py-1 rounded-full animate-bounce shadow-lg"
              >
                FINAL FORM
              </motion.div>
            )}
            {isPhase2 && !isPhase3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-lg"
              >
                ENRAGED
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hit Particles */}
          <AnimatePresence>
            {lastAction === 'attack' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {particles.map((p, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      width: p.size,
                      height: p.size,
                      borderRadius: '50%',
                      backgroundColor: p.color,
                      boxShadow: `0 0 ${p.size}px ${p.color}`,
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Critical Hit Indicator */}
          <AnimatePresence>
            {isCriticalHit && lastAction === 'attack' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.2, 1.5], y: -50 }}
                transition={{ duration: 1 }}
                className="absolute top-1/4 left-1/2 -translate-x-1/2 text-2xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]"
              >
                CRITICAL!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Speed Effect */}
      {playerStreak >= 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        />
      )}

      {/* Distance Indicator */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full border border-indigo-400/30">
        <p className="text-xs text-indigo-300 font-bold">Distance: {totalQuestionsAnswered * 50}m</p>
      </div>

      {/* Elemental Type Badge */}
      <div
        className="absolute top-4 right-4 px-3 py-1 rounded-full border"
        style={{
          backgroundColor: `${themeColor}20` || 'rgba(99, 102, 241, 0.2)',
          borderColor: themeColor || '#6366f1',
        }}
      >
        <p className="text-xs font-bold" style={{ color: themeColor || '#818cf8' }}>
          {elementalType}
        </p>
      </div>
    </motion.div>
  );
}
