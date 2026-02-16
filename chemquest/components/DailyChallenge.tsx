'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Gem, Coins, Clock, CheckCircle, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getTimeUntilNextChallenge } from '@/lib/challenges'
import type { DailyChallenge as Challenge } from '@/lib/challenges'

export function DailyChallenge() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [totalCompleted, setTotalCompleted] = useState(0)
  const [timeUntilNext, setTimeUntilNext] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChallenge()

    // Update time countdown every minute
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilNextChallenge())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTimeUntilNext(getTimeUntilNextChallenge())
  }, [challenge])

  const fetchChallenge = async () => {
    try {
      const response = await fetch('/api/user/challenge')
      if (response.ok) {
        const data = await response.json()
        setChallenge(data.challenge)
        setIsCompleted(data.isCompleted)
        setTotalCompleted(data.totalChallengesCompleted)
      }
    } catch (error) {
      console.error('Failed to fetch challenge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !challenge) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={`border-2 ${
        isCompleted
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
      }`}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Daily Challenge
            {isCompleted && <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />}
          </CardTitle>
          <CardDescription className="text-purple-200">
            Complete challenges to earn gems and coins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCompleted ? (
            <div className="space-y-3">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-300 font-semibold flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Challenge Completed!
                </p>
                <p className="text-green-200 text-sm">
                  You've earned today's rewards. Come back tomorrow for a new challenge!
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-purple-200">
                  <Clock className="w-4 h-4" />
                  <span>Next challenge in: {timeUntilNext}</span>
                </div>
                <div className="text-purple-200">
                  Total: {totalCompleted} completed
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{challenge.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{challenge.title}</h3>
                    <p className="text-purple-200 text-sm">{challenge.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 font-bold">+{challenge.reward.gems}</span>
                  </div>
                  {challenge.reward.coins && (
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">+{challenge.reward.coins}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-purple-200">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Complete the challenge to claim rewards</span>
                </div>
              </div>

              <p className="text-xs text-purple-300 text-center">
                Rewards are automatically claimed when you complete the challenge during gameplay
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
