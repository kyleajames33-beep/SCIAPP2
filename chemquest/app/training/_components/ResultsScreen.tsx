'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Coins, 
  Flame, 
  RotateCcw, 
  Home, 
  Star, 
  Target,
  TrendingUp,
  ArrowLeft,
  Zap,
  CheckCircle,
  XCircle,
  Beaker,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'
import { getRankInfo, formatXP, RankInfo, RankUpResult } from '@/lib/rank-system'
import { RankUpCelebration } from '@/app/campaign/boss/_components/RankUpCelebration'

type ResultsScreenProps = {
  gameMode: GameMode
  score: number
  coins: number
  xpGained?: number
  previousTotalXp?: number
  correctAnswers: number
  incorrectAnswers: number
  maxStreak: number
  questionsAnswered: number
  lives: number
  onRestart: () => void
  onReviewMistakes?: () => void
  isNewHighScore?: boolean
  previousBestScore?: number
  bossDefeated?: boolean
  chamberId?: string
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let animationFrame: number
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOut * target))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])
  
  return count
}

// Get performance feedback based on accuracy
function getPerformanceFeedback(accuracy: number): { message: string; emoji: string; color: string } {
  if (accuracy >= 90) {
    return { 
      message: "Master Chemist!", 
      emoji: "🧪", 
      color: "from-green-400 to-emerald-500" 
    }
  } else if (accuracy >= 70) {
    return { 
      message: "Solid Reaction!", 
      emoji: "⚗️", 
      color: "from-blue-400 to-cyan-500" 
    }
  } else {
    return { 
      message: "Keep Experimenting!", 
      emoji: "🔬", 
      color: "from-orange-400 to-amber-500" 
    }
  }
}

export function ResultsScreen({
  gameMode,
  score,
  coins,
  xpGained,
  previousTotalXp,
  correctAnswers,
  incorrectAnswers,
  maxStreak,
  questionsAnswered,
  lives,
  onRestart,
  onReviewMistakes,
  isNewHighScore = false,
  previousBestScore = 0,
  bossDefeated = false,
  chamberId
}: ResultsScreenProps) {
  const modeInfo = getModeDisplay(gameMode)
  const totalAnswered = gameMode === 'survival' ? questionsAnswered : (correctAnswers + incorrectAnswers)
  const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
  
  // Animated counters
  const animatedScore = useAnimatedCounter(score, 2000)
  const animatedCoins = useAnimatedCounter(coins, 1500)
  const animatedXP = useAnimatedCounter(xpGained || 0, 2500)
  
  // Rank calculations - use defaults if not provided
  const effectiveXpGained = xpGained || Math.floor(score * 0.1) // Estimate XP from score if not provided
  const effectivePreviousXp = previousTotalXp || 0
  const newTotalXp = effectivePreviousXp + effectiveXpGained
  const previousRankInfo = getRankInfo(effectivePreviousXp)
  const newRankInfo = getRankInfo(newTotalXp)
  const didRankUp = newRankInfo.currentRank.id > previousRankInfo.currentRank.id
  
  // Performance feedback
  const feedback = getPerformanceFeedback(accuracy)
  
  // Rank up celebration state
  const [showRankUp, setShowRankUp] = useState(false)
  
  useEffect(() => {
    if (didRankUp) {
      const timer = setTimeout(() => {
        setShowRankUp(true)
      }, 3000) // Show after other animations
      return () => clearTimeout(timer)
    }
  }, [didRankUp])
  
  // Victory or defeat theme
  const isVictory = accuracy >= 50 || (gameMode === 'boss_battle' && bossDefeated)
  const themeGradient = isVictory 
    ? "from-emerald-600 via-teal-600 to-cyan-600"
    : "from-rose-600 via-pink-600 to-purple-600"
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeGradient} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800) 
            }}
            animate={{ 
              y: [0, -100, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
        
        {/* Background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="w-full max-w-3xl relative z-10"
      >
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          {/* Header Glow */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feedback.color}`} />
          
          <CardHeader className="text-center pt-8 pb-4">
            {/* Performance Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="mb-4"
            >
              <Badge className={`bg-gradient-to-r ${feedback.color} text-white text-lg px-6 py-2 border-0`}>
                <span className="mr-2">{feedback.emoji}</span>
                {feedback.message}
              </Badge>
            </motion.div>
            
            {/* Main Trophy */}
            <motion.div 
              className="flex justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className={`w-24 h-24 ${isVictory ? 'text-yellow-400' : 'text-white/50'} drop-shadow-2xl`} />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2" />
                </motion.div>
              </div>
            </motion.div>
            
            <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white mb-2`}>
              {modeInfo?.name} Mode
            </Badge>
            
            <CardTitle className="text-4xl font-bold text-white">
              {gameMode === 'survival' && lives <= 0 ? 'Game Over!' : isVictory ? 'Victory!' : 'Good Try!'}
            </CardTitle>

            {/* High Score Badge */}
            <AnimatePresence>
              {isNewHighScore && (
                <motion.div
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", delay: 0.5 }}
                  className="mt-4"
                >
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-4 py-1">
                    🏆 NEW HIGH SCORE! 🏆
                  </Badge>
                  <p className="text-sm text-white/50 mt-1">
                    Previous Best: {previousBestScore.toLocaleString()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Boss Defeated Badge */}
            <AnimatePresence>
              {gameMode === 'boss_battle' && bossDefeated && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.6 }}
                  className="mt-3"
                >
                  <Badge className="bg-gradient-to-r from-red-500 to-purple-600 text-white text-sm px-4 py-1">
                    ⚔️ BOSS DEFEATED! ⚔️
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Score */}
              <motion.div 
                className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl text-center relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <motion.p 
                  className="text-5xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {animatedScore.toLocaleString()}
                </motion.p>
                <p className="text-sm text-white/50 mt-1">Final Score</p>
              </motion.div>
              
              {/* Coins */}
              <motion.div 
                className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl text-center relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                </motion.div>
                <motion.p 
                  className="text-5xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  +{animatedCoins.toLocaleString()}
                </motion.p>
                <p className="text-sm text-white/50 mt-1">Coins Earned</p>
              </motion.div>
            </div>
            
            {/* XP Section with Progress Bar */}
            <motion.div 
              className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ 
                      background: newRankInfo.currentRank.color,
                      boxShadow: `0 0 20px ${newRankInfo.currentRank.color}60`
                    }}
                  >
                    {newRankInfo.currentRank.badge}
                  </div>
                  <div>
                    <p className="text-white font-medium">{newRankInfo.currentRank.name} Rank</p>
                    <p className="text-white/50 text-sm">+{animatedXP} XP gained</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-400">{formatXP(newTotalXp)}</p>
                  <p className="text-xs text-white/40">Total XP</p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{formatXP(newRankInfo.currentXP - newRankInfo.currentRank.minXP)} / {formatXP((newRankInfo.nextRank?.minXP || newRankInfo.currentRank.minXP) - newRankInfo.currentRank.minXP)}</span>
                  <span>{Math.round(newRankInfo.xpProgress)}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: `${previousRankInfo.xpProgress}%` }}
                    animate={{ width: `${newRankInfo.xpProgress}%` }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${newRankInfo.currentRank.gradient}`}
                  />
                </div>
                {!newRankInfo.isMaxRank && newRankInfo.nextRank && (
                  <p className="text-xs text-white/40 text-center">
                    {formatXP(newRankInfo.xpToNextRank)} XP to {newRankInfo.nextRank.name}
                  </p>
                )}
              </div>
            </motion.div>
            
            {/* Detailed Stats */}
            <div className="grid grid-cols-4 gap-3">
              <motion.div 
                className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-400">{correctAnswers}</p>
                <p className="text-xs text-white/50">Correct</p>
              </motion.div>
              
              <motion.div 
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-400">{incorrectAnswers}</p>
                <p className="text-xs text-white/50">Wrong</p>
              </motion.div>
              
              <motion.div 
                className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-400">{accuracy}%</p>
                <p className="text-xs text-white/50">Accuracy</p>
              </motion.div>
              
              <motion.div 
                className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-400">{maxStreak}</p>
                <p className="text-xs text-white/50">Max Streak</p>
              </motion.div>
            </div>

            {gameMode === 'survival' && (
              <motion.div 
                className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-sm text-white/50">Questions Survived</p>
                <p className="text-3xl font-bold text-emerald-400">{questionsAnswered}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={onRestart}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 shadow-lg hover:shadow-purple-500/25 transition-all rounded-xl font-bold"
                >
                  <RotateCcw className="mr-2 w-5 h-5" />
                  Play Again
                </Button>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  {onReviewMistakes && incorrectAnswers > 0 ? (
                    <Button 
                      variant="outline" 
                      onClick={onReviewMistakes}
                      className="w-full rounded-xl border-white/20 text-white hover:bg-white/10 py-5"
                    >
                      <Beaker className="mr-2 w-4 h-4" />
                      Review Mistakes
                    </Button>
                  ) : (
                    <Link href={chamberId ? `/campaign` : "/hub"} className="block">
                      <Button 
                        variant="outline" 
                        className="w-full rounded-xl border-white/20 text-white hover:bg-white/10 py-5"
                      >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        {chamberId ? "Back to Campaign" : "Back to Hub"}
                      </Button>
                    </Link>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                >
                  <Link href="/leaderboard" className="block">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 py-5"
                    >
                      <Crown className="mr-2 w-4 h-4" />
                      Leaderboard
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Rank Up Celebration */}
      <AnimatePresence>
        {showRankUp && didRankUp && (
          <RankUpCelebration
            previousRank={{
              name: previousRankInfo.currentRank.name,
              symbol: previousRankInfo.currentRank.symbol,
              gradient: previousRankInfo.currentRank.gradient
            }}
            newRank={{
              name: newRankInfo.currentRank.name,
              symbol: newRankInfo.currentRank.symbol,
              gradient: newRankInfo.currentRank.gradient
            }}
            onComplete={() => setShowRankUp(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
