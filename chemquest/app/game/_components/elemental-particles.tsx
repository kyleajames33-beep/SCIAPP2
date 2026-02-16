'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

export type ElementalType = 'Acid-Base' | 'Redox' | 'Organic' | 'Thermodynamics' | 'Equilibrium' | 'Kinetics' | 'Atomic Structure' | 'Solutions';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  path: 'rise' | 'fall' | 'orbit' | 'float' | 'spark';
}

interface ElementalParticlesProps {
  elementalType: ElementalType;
  isActive: boolean;
  intensity?: 'low' | 'medium' | 'high';
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ELEMENTAL_CONFIGS: Record<ElementalType, {
  colors: string[];
  particleStyle: 'chemical' | 'energy' | 'organic' | 'thermal' | 'balanced' | 'fast' | 'atomic' | 'liquid';
  glowColor: string;
}> = {
  'Acid-Base': {
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#14b8a6'],
    particleStyle: 'chemical',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  'Redox': {
    colors: ['#ef4444', '#f87171', '#fca5a5', '#fee2e2', '#dc2626'],
    particleStyle: 'energy',
    glowColor: 'rgba(239, 68, 68, 0.4)',
  },
  'Organic': {
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed'],
    particleStyle: 'organic',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  'Thermodynamics': {
    colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ea580c'],
    particleStyle: 'thermal',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  'Equilibrium': {
    colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#0891b2'],
    particleStyle: 'balanced',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  'Kinetics': {
    colors: ['#eab308', '#facc15', '#fde047', '#fef08a', '#ca8a04'],
    particleStyle: 'fast',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  'Atomic Structure': {
    colors: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#db2777'],
    particleStyle: 'atomic',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },
  'Solutions': {
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb'],
    particleStyle: 'liquid',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
};

export function ElementalParticles({ elementalType, isActive, intensity = 'medium' }: ElementalParticlesProps) {
  const config = ELEMENTAL_CONFIGS[elementalType] || ELEMENTAL_CONFIGS['Acid-Base'];
  
  const particleCount = intensity === 'low' ? 8 : intensity === 'medium' ? 15 : 25;
  
  const particles = useMemo(() => {
    const paths: Particle['path'][] = ['rise', 'fall', 'orbit', 'float', 'spark'];
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: config.colors[i % config.colors.length],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      path: paths[i % paths.length],
    }));
  }, [elementalType, particleCount]);

  const getPathAnimation = (path: Particle['path'], x: number, y: number) => {
    switch (path) {
      case 'rise':
        return {
          y: [y + '%', (y - 30) + '%', (y - 60) + '%'],
          x: [x + '%', (x + (Math.random() - 0.5) * 20) + '%', x + '%'],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.3],
        };
      case 'fall':
        return {
          y: [y + '%', (y + 20) + '%', (y + 40) + '%'],
          x: [x + '%', (x + (Math.random() - 0.5) * 10) + '%', x + '%'],
          opacity: [0, 0.7, 0],
          scale: [0.3, 1, 0.5],
        };
      case 'orbit':
        const radius = 15 + Math.random() * 10;
        return {
          x: [x + '%', (x + radius) + '%', x + '%', (x - radius) + '%', x + '%'],
          y: [y + '%', (y + radius/2) + '%', y + '%', (y - radius/2) + '%', y + '%'],
          opacity: [0.6, 0.8, 0.6, 0.8, 0.6],
          scale: [0.8, 1, 1.2, 1, 0.8],
        };
      case 'float':
        return {
          y: [y + '%', (y - 10) + '%', y + '%', (y + 10) + '%', y + '%'],
          x: [x + '%', (x + 5) + '%', (x - 5) + '%', x + '%'],
          opacity: [0.4, 0.7, 0.5, 0.7, 0.4],
        };
      case 'spark':
        const sparkX = (Math.random() - 0.5) * 40;
        const sparkY = (Math.random() - 0.5) * 40;
        return {
          x: [x + '%', (x + sparkX) + '%'],
          y: [y + '%', (y + sparkY) + '%'],
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
        };
      default:
        return {};
    }
  };

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Ambient glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0"
        style={{ boxShadow: `inset 0 0 60px ${config.glowColor}` }}
      />

      {/* Particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              left: 0,
              top: 0,
            }}
            initial={{ opacity: 0 }}
            animate={getPathAnimation(particle.path, particle.x, particle.y)}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: particle.path === 'spark' ? 'easeOut' : 'easeInOut',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Style-specific effects */}
      {config.particleStyle === 'thermal' && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/3"
          style={{ background: `linear-gradient(to top, ${config.glowColor}, transparent)` }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {config.particleStyle === 'atomic' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`orbit-ring-${i}`}
              className="absolute rounded-full border"
              style={{
                width: 100 + i * 50,
                height: 100 + i * 50,
                borderColor: config.colors[i % config.colors.length] + '40',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 5 + i * 2,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}

      {config.particleStyle === 'liquid' && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/4"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `linear-gradient(to top, ${config.glowColor}, transparent)` }}
        />
      )}
    </div>
  );
}

// Screen shake utility hook
export function useScreenShake() {
  const [shakeClass, setShakeClass] = useState('');

  const triggerShake = (intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const shakeClasses = {
      light: 'animate-shake-light',
      medium: 'animate-shake-medium',
      heavy: 'animate-shake-heavy',
    };
    setShakeClass(shakeClasses[intensity]);
    setTimeout(() => setShakeClass(''), 500);
  };

  return { shakeClass, triggerShake };
}
