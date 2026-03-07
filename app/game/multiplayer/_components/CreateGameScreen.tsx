'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Crown, Play, Rocket, Shield, Loader2, Skull, Mountain } from 'lucide-react'
import { motion } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { GAME_MODE_DISPLAY } from '@/lib/game-config'

type CreateGameScreenProps = {
  nickname: string
  gameMode: GameMode
  isLoading: boolean
  onNicknameChange: (nickname: string) => void
  onModeChange: (mode: GameMode) => void
  onCreateGame: () => void
  onBack: () => void
}

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  classic: <Play className="w-6 h-6" />,
  rush: <Rocket className="w-6 h-6" />,
  survival: <Shield className="w-6 h-6" />,
  boss_battle: <Skull className="w-6 h-6" />,
  tower_climb: <Mountain className="w-6 h-6" />,
}

export function CreateGameScreen({
  nickname,
  gameMode,
  isLoading,
  onNicknameChange,
  onModeChange,
  onCreateGame,
  onBack
}: CreateGameScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle className="text-2xl">Host a Game</CardTitle>
            <CardDescription>Create a game for others to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Nickname</label>
              <Input
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                placeholder="Enter your nickname"
                className="text-lg py-5"
                maxLength={15}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Game Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {GAME_MODE_DISPLAY.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      gameMode === mode.id
                        ? `border-purple-500 bg-gradient-to-br ${mode.color} text-white`
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {MODE_ICONS[mode.id]}
                      <span className="text-xs font-medium">{mode.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={onCreateGame}
              disabled={isLoading || !nickname.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl font-bold"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Game'}
            </Button>

            <Button variant="ghost" onClick={onBack} className="w-full">
              Back
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
