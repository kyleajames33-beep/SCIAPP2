'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Clock, Users, ArrowRight, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameMode, Player } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'
import { Leaderboard } from './Leaderboard'
import { BossHpBar } from './boss-hp-bar'
import { DamagePopup } from './damage-popup'
import { BattleArena } from './battle-arena'

type Question = {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  topic: string
}

type AnswerResult = {
  isCorrect: boolean
  correctAnswer: number
  pointsEarned: number
}

type BossState = {
  bossHp: number
  bossMaxHp: number
  bossEnraged: boolean
  bossDefeated: boolean
  gemsEarned: number
}

type MultiplayerPlayProps = {
  gameMode: GameMode
  currentQuestion: number
  totalQuestions: number
  question: Question | null
  players: Player[]
  playerId: string
  isHost: boolean
  timeLeft: number
  answeredCount: number
  totalPlayers: number
  selectedAnswer: number | null
  isAnswered: boolean
  answerResult: AnswerResult | null
  allAnswered: boolean
  bossState?: BossState
  onSubmitAnswer: (index: number) => void
  onNextQuestion: () => void
}

export function MultiplayerPlay({
  gameMode,
  currentQuestion,
  totalQuestions,
  question,
  players,
  playerId,
  isHost,
  timeLeft,
  answeredCount,
  totalPlayers,
  selectedAnswer,
  isAnswered,
  answerResult,
  allAnswered,
  bossState,
  onSubmitAnswer,
  onNextQuestion
}: MultiplayerPlayProps) {
  const modeInfo = getModeDisplay(gameMode)
  const myPlayer = players.find(p => p.id === playerId)
  const options = question ? [
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
  ] : []
  
  // Boss battle damage tracking
  const [lastDamage, setLastDamage] = useState<{amount: number, isHeal: boolean} | null>(null)
  const prevBossHpRef = useRef(bossState?.bossHp)

  // Battle Arena animation state
  const [lastAction, setLastAction] = useState<'attack' | 'miss' | null>(null)
  
  // Track boss HP changes for damage popup
  useEffect(() => {
    if (gameMode !== 'boss_battle' || !bossState) return

    const currentHp = bossState.bossHp
    const prevHp = prevBossHpRef.current

    if (prevHp !== undefined && prevHp !== currentHp) {
      const hpChange = prevHp - currentHp
      if (hpChange !== 0) {
        setLastDamage({ amount: Math.abs(hpChange), isHeal: hpChange < 0 })
        setTimeout(() => setLastDamage(null), 1500)
      }
    }

    prevBossHpRef.current = currentHp
  }, [bossState?.bossHp, gameMode])

  // Trigger battle animations when answer result changes
  useEffect(() => {
    if (gameMode !== 'boss_battle' || !answerResult) return

    if (answerResult.isCorrect) {
      setLastAction('attack')
    } else {
      setLastAction('miss')
    }

    const timeout = setTimeout(() => {
      setLastAction(null)
    }, 600)

    return () => clearTimeout(timeout)
  }, [answerResult, gameMode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="max-w-6xl mx-auto py-4">
        {/* Boss Battle HP Bar */}
        {gameMode === 'boss_battle' && bossState && (
          <BossHpBar
            currentHp={bossState.bossHp}
            maxHp={bossState.bossMaxHp}
            isEnraged={bossState.bossEnraged}
            bossName="Chemistry Boss"
          />
        )}
        
        {/* Damage Popup */}
        {lastDamage && (
          <DamagePopup
            damage={lastDamage.amount}
            isHeal={lastDamage.isHeal}
          />
        )}

        {/* Battle Arena */}
        {gameMode === 'boss_battle' && bossState && (
          <BattleArena
            bossHp={bossState.bossHp}
            bossMaxHp={bossState.bossMaxHp}
            isEnraged={bossState.bossEnraged}
            lastAction={lastAction}
            playerStreak={myPlayer?.streak || 0}
            totalQuestionsAnswered={0}
          />
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-2">
              <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
                <CardContent className="p-3 text-center">
                  <Trophy className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-gray-900">{myPlayer?.score || 0}</p>
                  <p className="text-xs text-gray-600">Score</p>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
                <CardContent className="p-3 text-center">
                  <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-orange-600">{myPlayer?.streak || 0}</p>
                  <p className="text-xs text-gray-600">Streak</p>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
                <CardContent className="p-3 text-center">
                  <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-600">{answeredCount}/{totalPlayers}</p>
                  <p className="text-xs text-gray-600">Answered</p>
                </CardContent>
              </Card>
              <Card className={`backdrop-blur shadow-lg border-0 ${timeLeft <= 5 ? 'bg-red-100' : 'bg-white/95'}`}>
                <CardContent className="p-3 text-center">
                  <Clock className={`w-5 h-5 mx-auto mb-1 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
                  <p className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{timeLeft}s</p>
                  <p className="text-xs text-gray-600">Time</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            <Card className="bg-white/95 backdrop-blur shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Question {currentQuestion + 1} of {totalQuestions}</span>
                  <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white`}>{modeInfo?.name}</Badge>
                </div>
                <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-2" />
              </CardContent>
            </Card>

            {/* Question */}
            {question && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit mb-2">{question.topic}</Badge>
                      <CardTitle className="text-xl text-gray-900">{question.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {options.map((option, index) => {
                        const isSelected = selectedAnswer === index
                        const showResult = answerResult !== null
                        const isCorrect = showResult && index === answerResult.correctAnswer
                        const isWrong = showResult && isSelected && !answerResult.isCorrect

                        let buttonClass = 'w-full justify-start text-left h-auto py-4 px-5 text-base rounded-xl transition-all '
                        
                        if (showResult) {
                          if (isCorrect) {
                            buttonClass += 'bg-green-500 border-2 border-green-600 text-white'
                          } else if (isWrong) {
                            buttonClass += 'bg-red-500 border-2 border-red-600 text-white'
                          } else {
                            buttonClass += 'bg-gray-100 border-2 border-gray-200 text-gray-500'
                          }
                        } else if (isSelected) {
                          buttonClass += 'bg-purple-100 border-2 border-purple-500 text-gray-900'
                        } else {
                          buttonClass += 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-purple-400'
                        }

                        return (
                          <motion.div key={index} whileHover={{ scale: isAnswered ? 1 : 1.02 }} whileTap={{ scale: isAnswered ? 1 : 0.98 }}>
                            <Button
                              onClick={() => onSubmitAnswer(index)}
                              disabled={isAnswered}
                              className={buttonClass}
                            >
                              <span className={`font-bold mr-3 w-8 h-8 rounded-lg flex items-center justify-center ${
                                showResult && isCorrect ? 'bg-green-600 text-white' :
                                showResult && isWrong ? 'bg-red-600 text-white' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {['A', 'B', 'C', 'D'][index]}
                              </span>
                              <span className="flex-1">{option}</span>
                            </Button>
                          </motion.div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Host Controls */}
            {isHost && allAnswered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Button
                  onClick={onNextQuestion}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg py-6 rounded-xl font-bold"
                >
                  {currentQuestion + 1 >= totalQuestions ? 'See Results' : 'Next Question'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}

            {!isHost && allAnswered && (
              <Card className="bg-white/95 backdrop-blur border-0">
                <CardContent className="p-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                  <p className="text-gray-600">Waiting for host to continue...</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <Leaderboard players={players} currentPlayerId={playerId} />
          </div>
        </div>
      </div>
    </div>
  )
}
