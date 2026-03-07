'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Crown, Copy, Check, Play, Loader2, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { GameMode, Player } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'

type LobbyScreenProps = {
  gameCode: string
  gameMode: GameMode
  players: Player[]
  isHost: boolean
  copied: boolean
  onCopyCode: () => void
  onStartGame: () => void
  onLeaveGame: () => void
}

export function LobbyScreen({
  gameCode,
  gameMode,
  players,
  isHost,
  copied,
  onCopyCode,
  onStartGame,
  onLeaveGame
}: LobbyScreenProps) {
  const modeInfo = getModeDisplay(gameMode)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-white/95 backdrop-blur shadow-2xl border-0 mb-4">
            <CardHeader className="text-center">
              <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white mx-auto mb-2`}>
                <span className="ml-1">{modeInfo?.name} Mode</span>
              </Badge>
              <CardTitle className="text-2xl">Waiting for Players</CardTitle>
              <CardDescription>Share the code with friends to join</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">Game Code</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-4xl font-bold font-mono tracking-widest text-gray-900">{gameCode}</p>
                  <Button size="icon" variant="outline" onClick={onCopyCode}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">Players ({players.length})</h3>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {players.length} joined
                  </Badge>
                </div>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        player.isHost ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'
                      }`}>
                        {player.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 flex-1">{player.nickname}</span>
                      {player.isHost && (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Crown className="w-3 h-3 mr-1" /> Host
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {isHost ? (
                <Button
                  onClick={onStartGame}
                  disabled={players.length < 1}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-6 rounded-xl font-bold"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Start Game
                </Button>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                  <p className="text-gray-600">Waiting for host to start...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={onLeaveGame} className="w-full text-white hover:bg-white/20">
            <Home className="mr-2 w-4 h-4" /> Leave Game
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
