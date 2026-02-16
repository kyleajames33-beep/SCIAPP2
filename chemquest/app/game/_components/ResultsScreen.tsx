'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Coins, Flame, RotateCcw, Home, Star } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'

type ResultsScreenProps = {
  gameMode: GameMode
  score: number
  coins: number
  correctAnswers: number
  incorrectAnswers: number
  maxStreak: number
  questionsAnswered: number
  lives: number
  onRestart: () => void
  isNewHighScore?: boolean
  previousBestScore?: number
  bossDefeated?: boolean
}

export function ResultsScreen({
  gameMode,
  score,
  coins,
  correctAnswers,
  incorrectAnswers,
  maxStreak,
  questionsAnswered,
  lives,
  onRestart,
  isNewHighScore = false,
  previousBestScore = 0,
  bossDefeated = false
}: ResultsScreenProps) {
  const modeInfo = getModeDisplay(gameMode)
  const totalAnswered = gameMode === 'survival' ? questionsAnswered : (correctAnswers + incorrectAnswers)
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 360] }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Trophy className="w-24 h-24 text-yellow-500" />
                <Star className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-ping" />
              </div>
            </motion.div>
            <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white mb-2`}>
              {modeInfo?.name} Mode
            </Badge>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {gameMode === 'survival' && lives <= 0 ? 'Game Over!' : 'Game Complete!'}
            </CardTitle>

            {/* High Score Badge */}
            {isNewHighScore && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mt-4"
              >
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-4 py-1">
                  🏆 NEW HIGH SCORE! 🏆
                </Badge>
                <p className="text-sm text-gray-500 mt-1">
                  Previous Best: {previousBestScore}
                </p>
              </motion.div>
            )}

            {/* Boss Defeated Badge */}
            {gameMode === 'boss_battle' && bossDefeated && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mt-3"
              >
                <Badge className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-sm px-4 py-1">
                  ⚔️ BOSS DEFEATED! ⚔️
                </Badge>
              </motion.div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl text-center">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-4xl font-bold text-purple-700">{score}</p>
                <p className="text-sm text-gray-600">Final Score</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-xl text-center">
                <Coins className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-4xl font-bold text-yellow-700">{coins}</p>
                <p className="text-sm text-gray-600">Coins Earned</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
                <p className="text-xs text-gray-600">Correct</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-red-600">{incorrectAnswers}</p>
                <p className="text-xs text-gray-600">Wrong</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                <p className="text-xs text-gray-600">Accuracy</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-600">{maxStreak}</p>
                </div>
                <p className="text-xs text-gray-600">Max Streak</p>
              </div>
            </div>

            {gameMode === 'survival' && (
              <div className="bg-emerald-50 p-4 rounded-xl text-center">
                <p className="text-sm text-gray-600">Questions Survived</p>
                <p className="text-3xl font-bold text-emerald-600">{questionsAnswered}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={onRestart}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl py-7 shadow-lg hover:shadow-xl transition-all rounded-xl font-bold"
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Play Again
              </Button>

              <Link href="/" className="block">
                <Button variant="outline" className="w-full rounded-xl">
                  <Home className="mr-2 w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
