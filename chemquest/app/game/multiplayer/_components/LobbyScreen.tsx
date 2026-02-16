'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Crown, Copy, Check, Play, Loader2, Home, Sword, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameMode, Player } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'
import { getRankByXP } from '@/lib/rank-system'
import { toast } from 'sonner'

type LobbyScreenProps = {
  gameCode: string
  gameMode: GameMode
  players: Player[]
  isHost: boolean
  onStartGame: () => void
  onLeaveGame: () => void
  hostRank?: number
}

function RankBadge({ xp }: { xp?: number }) {
  const rank = getRankByXP(xp || 0)
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
      style={{ 
        background: rank.color,
        boxShadow: `0 0 8px ${rank.color}80`
      }}
      title={`${rank.name} Rank`}
    >
      {rank.symbol}
    </div>
  )
}

export function LobbyScreen({
  gameCode,
  gameMode,
  players,
  isHost,
  onStartGame,
  onLeaveGame,
  hostRank
}: LobbyScreenProps) {
  const modeInfo = getModeDisplay(gameMode)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode)
      setCopied(true)
      toast.success('Room code copied!', {
        description: 'Share it with your friends to join',
        icon: '📋'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const handleStartGame = () => {
    setIsStarting(true)
    onStartGame()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/40 to-slate-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-2xl mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Game Mode Badge */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white text-sm px-4 py-1 border-0`}>
                <Sword className="w-4 h-4 mr-2" />
                {modeInfo?.name} Mode
              </Badge>
            </motion.div>
          </div>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
            {/* Decorative header line */}
            <div className={`h-1 bg-gradient-to-r ${modeInfo?.color}`} />
            
            <CardHeader className="text-center pt-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 mb-4"
              >
                <Users className="w-10 h-10 text-white/80" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-white">Waiting Room</CardTitle>
              <CardDescription className="text-white/50">
                Share the room code with friends to join the battle
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Room Code Display */}
              <motion.div 
                className="bg-gradient-to-r from-white/5 to-white/10 border border-white/20 p-6 rounded-2xl text-center relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5" />
                <p className="text-sm text-white/50 mb-2 uppercase tracking-wider">Room Code</p>
                <div className="flex items-center justify-center gap-4 relative">
                  <motion.p 
                    className="text-5xl font-bold font-mono tracking-[0.3em] text-white"
                    initial={{ opacity: 0, letterSpacing: '0.5em' }}
                    animate={{ opacity: 1, letterSpacing: '0.3em' }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    {gameCode}
                  </motion.p>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleCopyCode}
                    className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </motion.div>

              {/* Players List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Players
                  </h3>
                  <Badge variant="outline" className="border-white/20 text-white/70">
                    {players.length} / 8 joined
                  </Badge>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  <AnimatePresence>
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          player.isHost 
                            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Avatar className={`w-12 h-12 border-2 ${
                          player.isHost 
                            ? 'border-yellow-500/50' 
                            : 'border-purple-500/30'
                        }`}>
                          <AvatarFallback className={`text-lg font-bold ${
                            player.isHost 
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                              : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                          }`}>
                            {player.nickname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">
                              {player.nickname}
                            </span>
                            {player.isHost && (
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                <Crown className="w-3 h-3 mr-1" /> Host
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-white/40">
                            {player.isHost ? 'Room Owner' : 'Player'}
                          </p>
                        </div>

                        {/* Rank Badge */}
                        <RankBadge xp={(player as any).totalXp} />

                        {/* Connection Status */}
                        <div className={`w-2 h-2 rounded-full ${
                          (player as any).isConnected !== false 
                            ? 'bg-green-400 animate-pulse' 
                            : 'bg-red-400'
                        }`} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Empty Slots */}
                {players.length < 4 && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-white/30 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Waiting for more players...</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                {isHost ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      onClick={handleStartGame}
                      disabled={players.length < 2 || isStarting}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-7 rounded-xl font-bold shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                      {isStarting ? (
                        <>
                          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 w-5 h-5" />
                          Start Game
                          <span className="ml-2 text-sm font-normal opacity-80">
                            ({players.length} players)
                          </span>
                        </>
                      )}
                    </Button>
                    {players.length < 2 && (
                      <p className="text-center text-white/40 text-sm mt-2">
                        Need at least 2 players to start
                      </p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center p-6 bg-white/5 rounded-xl border border-white/10"
                  >
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
                    <p className="text-white/70 font-medium">Waiting for host to start...</p>
                    <p className="text-white/40 text-sm mt-1">
                      The game will begin when the host is ready
                    </p>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-center"
          >
            <Button 
              variant="ghost" 
              onClick={onLeaveGame} 
              className="text-white/40 hover:text-white hover:bg-white/10"
            >
              <Home className="mr-2 w-4 h-4" /> Leave Room
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
