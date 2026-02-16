'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sword, Zap } from 'lucide-react'

interface VersusAnimationProps {
  isVisible: boolean
  onComplete: () => void
  playerCount?: number
}

export function VersusAnimation({ isVisible, onComplete, playerCount = 2 }: VersusAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          {/* Background Split Effect */}
          <div className="absolute inset-0 flex">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-1/2 bg-gradient-to-r from-purple-900 to-purple-600"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-1/2 bg-gradient-to-l from-cyan-900 to-cyan-600"
            />
          </div>

          {/* Lightning Effects */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/4 left-1/4 w-1 h-32 bg-yellow-400 rotate-45 blur-sm" />
            <div className="absolute bottom-1/4 right-1/4 w-1 h-32 bg-yellow-400 -rotate-45 blur-sm" />
          </motion.div>

          {/* VS Text */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
            className="relative z-10"
          >
            <div className="relative">
              {/* VS Circle */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255,255,255,0.3)',
                    '0 0 60px rgba(255,255,255,0.6)',
                    '0 0 20px rgba(255,255,255,0.3)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center"
              >
                <span className="text-6xl font-black text-white drop-shadow-lg italic">
                  VS
                </span>
              </motion.div>

              {/* Rotating swords */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-4"
              >
                <Sword className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-white/50" />
                <Sword className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 text-white/50 rotate-180" />
                <Sword className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-white/50 -rotate-90" />
                <Sword className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 text-white/50 rotate-90" />
              </motion.div>
            </div>

            {/* Player Count */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/80 text-center mt-8 text-lg font-medium"
            >
              <Zap className="w-5 h-5 inline mr-2 text-yellow-400" />
              {playerCount} Players Battle
              <Zap className="w-5 h-5 inline ml-2 text-yellow-400" />
            </motion.p>
          </motion.div>

          {/* Particle Effects */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: '50vw',
                y: '50vh',
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 0],
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1.5, 0]
              }}
              transition={{ 
                duration: 1 + Math.random(),
                delay: Math.random() * 0.5,
                repeat: 2
              }}
              className="absolute w-2 h-2 bg-white rounded-full"
            />
          ))}

          {/* Auto-complete timeout */}
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
            onAnimationComplete={onComplete}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-red-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
