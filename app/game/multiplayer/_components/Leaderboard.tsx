'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Crown, Check, Zap, TrendingUp, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Player } from '@/lib/game-types'
import { getRankByXP } from '@/lib/rank-system'

type LeaderboardProps = {
  players: Player[]
  currentPlayerId: string
  showRankBadges?: boolean
}

function RankBadge({ xp }: { xp?: number }) {
  const rank = getRankByXP(xp || 0)
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
      style={{ 
        background: rank.color,
        boxShadow: `0 0 6px ${rank.color}80`
      }}
      title={`${rank.name} Rank`}
    >
      {rank.symbol}
    </div>
  )
}

export function Leaderboard({ players, currentPlayerId, showRankBadges = true }: LeaderboardProps) {
  // Track previous positions for animation
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({})
  const [pulsePlayers, setPulsePlayers] = useState<Set<string>>(new Set())
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  
  // Detect rank changes
  useEffect(() => {
    const currentRanks: Record<string, number> = {}
    const overtookPlayers: string[] = []
    
    sortedPlayers.forEach((player, index) => {
      currentRanks[player.id] = index
      
      // Check if this player overtook someone
      if (prevRanks[player.id] !== undefined && prevRanks[player.id] > index) {
        overtookPlayers.push(player.id)
      }
    })
    
    // Trigger pulse for players who overtook
    if (overtookPlayers.length > 0) {
      setPulsePlayers(new Set(overtookPlayers))
      
      // Clear pulse after animation
      setTimeout(() => {
        setPulsePlayers(new Set())
      }, 2000)
    }
    
    setPrevRanks(currentRanks)
  }, [sortedPlayers.map(p => p.score).join(',')])

  return (
    <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl sticky top-4 overflow-hidden">
      {/* Header gradient line */}
      <div className="h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
      
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-white">Live Leaderboard</span>
          </div>
          <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
            <Zap className="w-3 h-3 mr-1 text-yellow-400" />
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {sortedPlayers.map((player, index) => {
              const isCurrentPlayer = player.id === currentPlayerId
              const isTop3 = index < 3
              const isPulsing = pulsePlayers.has(player.id)
              const overtook = prevRanks[player.id] !== undefined && prevRanks[player.id] > index
              
              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    scale: isPulsing ? [1, 1.05, 1] : 1,
                  }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ 
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                    scale: { duration: 0.5 }
                  }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isCurrentPlayer 
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/40' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }
                    ${isPulsing ? 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-400/20' : ''}
                  `}
                >
                  {/* Rank Number */}
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-white/10 text-white/60'
                    }
                  `}>
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white
                    ${player.isHost 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500' 
                      : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    }
                  `}>
                    {player.nickname.charAt(0).toUpperCase()}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-medium truncate text-sm ${
                        isCurrentPlayer ? 'text-white' : 'text-white/80'
                      }`}>
                        {player.nickname}
                      </p>
                      {player.isHost && (
                        <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      )}
                      {overtook && (
                        <motion.div
                          initial={{ scale: 0, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          className="flex items-center text-green-400"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </motion.div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {player.streak}
                      </span>
                      {player.hasAnswered && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-green-500/30 text-green-400">
                          <Check className="w-2 h-2 mr-0.5" />
                          Done
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rank Badge */}
                  {showRankBadges && (
                    <RankBadge xp={(player as any).totalXp} />
                  )}

                  {/* Score */}
                  <motion.div 
                    className="text-right"
                    animate={isPulsing ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <p className={`font-bold text-sm ${
                      isTop3 ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {player.score.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/40">pts</p>
                  </motion.div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Bottom stats */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span>{players.filter(p => p.hasAnswered).length} / {players.length} answered</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Live updates
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
