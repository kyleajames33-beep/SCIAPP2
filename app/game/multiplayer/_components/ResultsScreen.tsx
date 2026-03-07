'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Star, Crown, Medal, RotateCcw, Home, Sparkles, Zap, Target, Flame, Users } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Player } from '@/lib/game-types'
import { getRankByXP, getRankInfo, formatXP } from '@/lib/rank-system'
import { RankUpCelebration } from '@/app/campaign/boss/_components/RankUpCelebration'

type ResultsScreenProps = {
  players: Player[]
  playerId: string
  onPlayAgain: () => void
  previousTotalXp?: number
}

function RankBadge({ xp }: { xp?: number }) {
  const rank = getRankByXP(xp || 0)
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
      style={{ 
        background: rank.color,
        boxShadow: `0 0 12px ${rank.color}80`
      }}
    >
      {rank.symbol}
    </div>
  )
}

// XP calculation for multiplayer (1.2x bonus)
function calculateMultiplayerXP(rank: number, score: number): { base: number; bonus: number; total: number } {
  const baseXP = Math.floor(score * 0.1)
  const rankBonus = rank === 1 ? 100 : rank === 2 ? 50 : rank === 3 ? 25 : 0
  const multiplayerBonus = Math.floor(baseXP * 0.2) // 1.2x multiplier
  
  return {
    base: baseXP,
    bonus: rankBonus + multiplayerBonus,
    total: baseXP + rankBonus + multiplayerBonus
  }
}

export function ResultsScreen({ players, playerId, onPlayAgain, previousTotalXp = 0 }: ResultsScreenProps) {
  const [showRankUp, setShowRankUp] = useState(false)
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  const myPlayer = sortedPlayers.find(p => p.id === playerId)
  const myRank = sortedPlayers.findIndex(p => p.id === playerId) + 1
  
  const isWinner = winner?.id === playerId
  
  // Calculate XP earned
  const xpEarned = myPlayer ? calculateMultiplayerXP(myRank, myPlayer.score) : { base: 0, bonus: 0, total: 0 }
  const newTotalXp = previousTotalXp + xpEarned.total
  
  // Check for rank up
  const previousRankInfo = getRankInfo(previousTotalXp)
  const newRankInfo = getRankInfo(newTotalXp)
  const didRankUp = newRankInfo.currentRank.id > previousRankInfo.currentRank.id
  
  // Show rank up celebration after a delay
  const handleShowRankUp = () => {
    if (didRankUp) {
      setTimeout(() => setShowRankUp(true), 1500)
    }
  }

  // Podium data - reorder for visual display (2nd, 1st, 3rd)
  const podiumPlayers = [
    sortedPlayers[1], // 2nd place (left)
    sortedPlayers[0], // 1st place (center)
    sortedPlayers[2], // 3rd place (right)
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl relative z-10"
        onAnimationComplete={handleShowRankUp}
      >
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`h-1 bg-gradient-to-r ${isWinner ? 'from-yellow-400 via-amber-400 to-yellow-600' : 'from-purple-500 via-pink-500 to-cyan-500'}`} />
          
          <CardHeader className="text-center pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <Trophy className={`w-20 h-20 ${isWinner ? 'text-yellow-400' : 'text-white/50'}`} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2" />
                </motion.div>
              </div>
            </motion.div>
            
            <CardTitle className="text-3xl font-bold text-white">
              {isWinner ? '🎉 Victory!' : 'Game Over'}
            </CardTitle>
            <CardDescription className="text-white/50">
              {isWinner 
                ? 'You dominated the competition!' 
                : `${winner?.nickname} takes the crown!`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Podium */}
            {sortedPlayers.length >= 2 && (
              <div className="flex justify-center items-end gap-4 mb-8">
                {podiumPlayers.map((player, displayIndex) => {
                  if (!player) return null
                  
                  // Map display index to actual rank
                  const actualRank = displayIndex === 0 ? 2 : displayIndex === 1 ? 1 : 3
                  const heights = ['h-32', 'h-44', 'h-28']
                  const colors = [
                    'from-slate-300 to-slate-500', // Silver (2nd)
                    'from-yellow-300 to-yellow-600', // Gold (1st)
                    'from-orange-300 to-orange-600' // Bronze (3rd)
                  ]
                  const medalColors = ['text-slate-300', 'text-yellow-400', 'text-orange-400']
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: displayIndex * 0.2, type: 'spring' }}
                      className={`flex flex-col items-center ${displayIndex === 1 ? 'z-10' : 'z-0'}`}
                    >
                      {/* Player Info */}
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="text-center mb-3"
                      >
                        <div className={`
                          w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold text-white
                          bg-gradient-to-br ${colors[displayIndex]}
                          ${displayIndex === 1 ? 'ring-4 ring-yellow-400/50 shadow-xl shadow-yellow-400/30' : ''}
                        `}>
                          {player.nickname.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-white text-sm truncate max-w-24">
                          {player.nickname}
                        </p>
                        <p className="text-white/50 text-xs">{player.score.toLocaleString()} pts</p>
                        
                        {/* XP Badge */}
                        <Badge className="mt-1 bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          +{calculateMultiplayerXP(actualRank, player.score).total} XP
                        </Badge>
                      </motion.div>

                      {/* Podium Block */}
                      <motion.div 
                        className={`${heights[displayIndex]} w-20 rounded-t-lg flex items-end justify-center pb-2
                          bg-gradient-to-t ${colors[displayIndex]} opacity-80
                        `}
                        initial={{ height: 0 }}
                        animate={{ height: heights[displayIndex].replace('h-', '') }}
                        transition={{ delay: 0.5 + displayIndex * 0.1, duration: 0.5 }}
                      >
                        <span className={`text-2xl font-bold ${medalColors[displayIndex]}`}>
                          {actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉'}
                        </span>
                      </motion.div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* My Stats */}
            {myPlayer && (
              <motion.div 
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    Your Performance
                  </h3>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    #{myRank} Place
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{myPlayer.score.toLocaleString()}</p>
                    <p className="text-xs text-white/50">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400">{myPlayer.streak}</p>
                    <p className="text-xs text-white/50">Best Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{xpEarned.base}</p>
                    <p className="text-xs text-white/50">Base XP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                      {xpEarned.total}
                      <Sparkles className="w-4 h-4" />
                    </p>
                    <p className="text-xs text-white/50">Total XP</p>
                  </div>
                </div>

                {/* XP Bonus Breakdown */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Multiplayer Bonus (1.2x)</span>
                    <span className="text-green-400">+{xpEarned.bonus} XP</span>
                  </div>
                  {myRank <= 3 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-white/60">Rank Bonus (Top 3)</span>
                      <span className="text-yellow-400">+{myRank === 1 ? 100 : myRank === 2 ? 50 : 25} XP</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Full Leaderboard */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              <h4 className="text-white/60 text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Final Standings
              </h4>
              {sortedPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    player.id === playerId 
                      ? 'bg-purple-500/20 border border-purple-500/30' 
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-slate-400/20 text-slate-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-white/10 text-white/50'
                    }
                  `}>
                    {index + 1}
                  </span>
                  
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={`text-xs font-bold text-white ${
                      player.isHost 
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    }`}>
                      {player.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${
                      player.id === playerId ? 'text-white' : 'text-white/80'
                    }`}>
                      {player.nickname}
                      {player.isHost && <Crown className="w-3 h-3 text-yellow-400 inline ml-1" />}
                    </p>
                  </div>
                  
                  <RankBadge xp={(player as any).totalXp} />
                  
                  <span className="font-bold text-white">{player.score.toLocaleString()}</span>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={onPlayAgain}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6 rounded-xl font-bold shadow-lg shadow-purple-500/20"
              >
                <RotateCcw className="mr-2 w-5 h-5" />
                Play Again
              </Button>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full rounded-xl border-white/20 text-white hover:bg-white/10 py-5">
                  <Home className="mr-2 w-4 h-4" />
                  Back to Home
                </Button>
              </Link>
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
