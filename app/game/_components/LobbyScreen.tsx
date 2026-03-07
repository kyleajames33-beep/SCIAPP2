'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, ArrowRight, Play, Rocket, Shield, Skull, Mountain } from 'lucide-react'
import { motion } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'

type LobbyScreenProps = {
  gameMode: GameMode
  isLoading: boolean
  onStartGame: () => void
  onBack: () => void
}

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  classic: <Play className="w-10 h-10" />,
  rush: <Rocket className="w-10 h-10" />,
  survival: <Shield className="w-10 h-10" />,
  boss_battle: <Skull className="w-10 h-10" />,
  tower_climb: <Mountain className="w-10 h-10" />,
}

export function LobbyScreen({
  gameMode,
  isLoading,
  onStartGame,
  onBack
}: LobbyScreenProps) {
  const modeInfo = getModeDisplay(gameMode)
  
  if (!modeInfo) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-lg bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${modeInfo.color} flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
              {MODE_ICONS[gameMode]}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              {modeInfo.name} Mode
            </CardTitle>
            <CardDescription className="text-base">
              {modeInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-xl">
              <div className="flex justify-center gap-4">
                {modeInfo.details.map((detail, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-bold text-gray-900">{detail.split(' ')[0]}</p>
                    <p className="text-xs text-gray-600">{detail.split(' ').slice(1).join(' ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 rounded-xl">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">Starting with</span>
              <span className="font-bold text-yellow-600">100 coins</span>
            </div>

            <Button
              onClick={onStartGame}
              disabled={isLoading}
              className={`w-full bg-gradient-to-r ${modeInfo.color} hover:opacity-90 text-white text-xl py-7 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold`}
            >
              {isLoading ? 'Loading...' : 'Start Game'}
              <ArrowRight className="ml-2 w-6 h-6" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full rounded-xl"
              onClick={onBack}
            >
              Choose Different Mode
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
