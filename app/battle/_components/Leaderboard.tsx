'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Crown, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { Player } from '@/lib/game-types'

type LeaderboardProps = {
  players: Player[]
  currentPlayerId: string
}

export function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <Card className="bg-white/95 backdrop-blur shadow-lg border-0 sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Live Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-3 p-3 rounded-lg ${
                player.id === currentPlayerId ? 'bg-purple-100 border-2 border-purple-300' : 'bg-gray-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-orange-400' : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate flex items-center gap-1">
                  {player.nickname}
                  {player.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-orange-400" />
                    {player.streak}
                  </span>
                  {player.hasAnswered && (
                    <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                      <Check className="w-2 h-2" />
                    </Badge>
                  )}
                </div>
              </div>
              <p className="font-bold text-purple-600">{player.score}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
