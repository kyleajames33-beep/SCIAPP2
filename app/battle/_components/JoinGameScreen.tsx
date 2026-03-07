'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

type JoinGameScreenProps = {
  nickname: string
  joinCode: string
  isLoading: boolean
  onNicknameChange: (nickname: string) => void
  onJoinCodeChange: (code: string) => void
  onJoinGame: () => void
  onBack: () => void
}

export function JoinGameScreen({
  nickname,
  joinCode,
  isLoading,
  onNicknameChange,
  onJoinCodeChange,
  onJoinGame,
  onBack
}: JoinGameScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <CardTitle className="text-2xl">Join a Game</CardTitle>
            <CardDescription>Enter the game code from your host</CardDescription>
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
              <label className="text-sm font-medium text-gray-700 mb-2 block">Game Code</label>
              <Input
                value={joinCode}
                onChange={(e) => onJoinCodeChange(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="text-2xl py-5 text-center font-mono tracking-widest"
                maxLength={6}
              />
            </div>

            <Button
              onClick={onJoinGame}
              disabled={isLoading || !nickname.trim() || !joinCode.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-lg py-6 rounded-xl font-bold"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Game'}
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
