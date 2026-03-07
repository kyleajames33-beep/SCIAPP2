'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Star, Crown, Medal, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Player } from '@/lib/game-types'

type ResultsScreenProps = {
  players: Player[]
  playerId: string
  onPlayAgain: () => void
}

export function ResultsScreen({ players, playerId, onPlayAgain }: ResultsScreenProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  const myPlayer = sortedPlayers.find(p => p.id === playerId)
  const myRank = sortedPlayers.findIndex(p => p.id === playerId) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 360] }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-4"
            >
              <div className="relative">
                <Trophy className="w-20 h-20 text-yellow-500" />
                <Star className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-ping" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold">
              {winner?.id === playerId ? '🎉 You Won!' : `${winner?.nickname} Wins!`}
            </CardTitle>
            <CardDescription>Final Results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Podium */}
            <div className="flex justify-center items-end gap-4 mb-6">
              {sortedPlayers.slice(0, 3).map((player, index) => {
                const heights = ['h-28', 'h-20', 'h-16']
                const positions = [1, 0, 2]
                const actualIndex = positions[index]
                const actualPlayer = sortedPlayers[actualIndex]
                if (!actualPlayer) return null
                
                return (
                  <motion.div
                    key={actualPlayer.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg ${
                      actualIndex === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-300' :
                      actualIndex === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      'bg-gradient-to-br from-orange-300 to-orange-500'
                    }`}>
                      {actualPlayer.nickname.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate max-w-20">{actualPlayer.nickname}</p>
                    <p className="text-purple-600 font-bold">{actualPlayer.score}</p>
                    <div className={`${heights[actualIndex]} w-16 bg-gradient-to-t ${
                      actualIndex === 0 ? 'from-yellow-500 to-yellow-300' :
                      actualIndex === 1 ? 'from-gray-400 to-gray-200' :
                      'from-orange-400 to-orange-200'
                    } rounded-t-lg mt-2 flex items-center justify-center`}>
                      <Medal className={`w-6 h-6 ${
                        actualIndex === 0 ? 'text-yellow-700' :
                        actualIndex === 1 ? 'text-gray-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Your Stats */}
            {myPlayer && (
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-center text-gray-600 mb-2">Your Results</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">#{myRank}</p>
                    <p className="text-xs text-gray-500">Rank</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{myPlayer.score}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{(myPlayer as any).maxStreak || myPlayer.streak}</p>
                    <p className="text-xs text-gray-500">Best Streak</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    player.id === playerId ? 'bg-purple-100' : 'bg-gray-50'
                  }`}
                >
                  <span className="w-6 text-center font-bold text-gray-500">#{index + 1}</span>
                  <span className="flex-1 font-medium truncate">
                    {player.nickname}
                    {player.isHost && <Crown className="w-3 h-3 text-yellow-500 inline ml-1" />}
                  </span>
                  <span className="font-bold text-purple-600">{player.score}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={onPlayAgain}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl font-bold"
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
