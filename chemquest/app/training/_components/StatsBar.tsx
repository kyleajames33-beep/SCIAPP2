'use client'

import { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Coins, Flame, Clock, Heart } from 'lucide-react'
import { GameMode } from '@/lib/game-types'

type StatsBarProps = {
  score: number
  coins: number
  streak: number
  lives: number
  timeLeft: number
  isTimeFrozen: boolean
  gameMode: GameMode
  onOpenShop: () => void
}

export function StatsBar({
  score,
  coins,
  streak,
  lives,
  timeLeft,
  isTimeFrozen,
  gameMode,
  onOpenShop
}: StatsBarProps) {
  const [prevStreak, setPrevStreak] = useState(streak)
  const streakControls = useAnimation()

  // Streak animation effect
  useEffect(() => {
    if (streak > prevStreak && streak > 0) {
      // Trigger shake and grow animation
      streakControls.start({
        scale: [1, 1.3, 1],
        rotate: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.5 }
      })
    }
    setPrevStreak(streak)
  }, [streak, prevStreak, streakControls])

  // Determine streak styling based on combo level
  const getStreakStyles = () => {
    if (streak >= 10) {
      return {
        cardClass: 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/50',
        textClass: 'text-red-500',
        iconClass: 'text-red-500',
        glow: true,
        firePulse: true
      }
    } else if (streak >= 5) {
      return {
        cardClass: 'bg-gradient-to-br from-orange-400/20 to-yellow-400/20 border-orange-400/50',
        textClass: 'text-orange-500',
        iconClass: 'text-orange-500',
        glow: true,
        firePulse: false
      }
    }
    return {
      cardClass: 'bg-white/95',
      textClass: 'text-orange-600',
      iconClass: 'text-orange-500',
      glow: false,
      firePulse: false
    }
  }

  const streakStyles = getStreakStyles()

  return (
    <div className={`grid ${gameMode === 'survival' ? 'grid-cols-5' : 'grid-cols-4'} gap-3 mb-4`}>
      <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
        <CardContent className="p-4 text-center">
          <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{score}</p>
          <p className="text-xs text-gray-600">Score</p>
        </CardContent>
      </Card>

      <Card 
        className="bg-white/95 backdrop-blur shadow-lg border-0 cursor-pointer hover:bg-yellow-50 transition-colors"
        onClick={onOpenShop}
      >
        <CardContent className="p-4 text-center relative">
          <Coins className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-600">{coins}</p>
          <p className="text-xs text-gray-600">Coins</p>
          <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs px-1.5">
            Shop
          </Badge>
        </CardContent>
      </Card>

      <motion.div
        animate={streakControls}
        className="relative"
      >
        <Card 
          className={`backdrop-blur shadow-lg border-2 transition-all duration-300 ${streakStyles.cardClass}`}
          style={streakStyles.glow ? {
            boxShadow: streak >= 10 
              ? '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)'
              : '0 0 15px rgba(249, 115, 22, 0.4)'
          } : {}}
        >
          <CardContent className="p-4 text-center">
            <motion.div
              animate={streakStyles.firePulse ? {
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              } : {}}
              transition={streakStyles.firePulse ? {
                duration: 0.5,
                repeat: Infinity,
                repeatType: 'loop'
              } : {}}
            >
              <Flame className={`w-6 h-6 mx-auto mb-1 ${streakStyles.iconClass}`} />
            </motion.div>
            <p className={`text-2xl font-bold ${streakStyles.textClass}`}>{streak}</p>
            <p className="text-xs text-gray-600">
              {streak >= 10 ? '🔥 INFERNO!' : streak >= 5 ? '🔥 Heating Up!' : 'Streak'}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {gameMode === 'survival' && (
        <Card className={`backdrop-blur shadow-lg border-0 transition-colors ${
          lives <= 1 ? 'bg-red-100' : 'bg-white/95'
        }`}>
          <CardContent className="p-4 text-center">
            <Heart className={`w-6 h-6 mx-auto mb-1 ${lives <= 1 ? 'text-red-500 animate-pulse' : 'text-pink-500'}`} />
            <p className={`text-2xl font-bold ${lives <= 1 ? 'text-red-600' : 'text-pink-600'}`}>{lives}</p>
            <p className="text-xs text-gray-600">Lives</p>
          </CardContent>
        </Card>
      )}

      <Card className={`backdrop-blur shadow-lg border-0 transition-colors ${
        isTimeFrozen ? 'bg-cyan-100' : timeLeft <= 10 ? 'bg-red-100' : 'bg-white/95'
      }`}>
        <CardContent className="p-4 text-center">
          <Clock className={`w-6 h-6 mx-auto mb-1 ${
            isTimeFrozen ? 'text-cyan-500' : timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-500'
          }`} />
          <p className={`text-2xl font-bold ${
            isTimeFrozen ? 'text-cyan-600' : timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {isTimeFrozen ? '⏸️' : `${timeLeft}s`}
          </p>
          <p className="text-xs text-gray-600">{isTimeFrozen ? 'Frozen!' : 'Time'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
