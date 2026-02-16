'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

type MenuScreenProps = {
  onHostGame: () => void
  onJoinGame: () => void
}

export function MenuScreen({ onHostGame, onJoinGame }: MenuScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Users className="w-16 h-16 text-purple-600" />
                <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Multiplayer</CardTitle>
            <CardDescription>Play with friends in real-time!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={onHostGame}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg py-6 rounded-xl font-bold"
            >
              <Crown className="mr-2 w-5 h-5" />
              Host Game
            </Button>
            
            <Button
              onClick={onJoinGame}
              variant="outline"
              className="w-full text-lg py-6 rounded-xl font-bold"
            >
              <Users className="mr-2 w-5 h-5" />
              Join Game
            </Button>

            <Link href="/training" className="block">
              <Button variant="ghost" className="w-full">
                <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                Back to Single Player
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
