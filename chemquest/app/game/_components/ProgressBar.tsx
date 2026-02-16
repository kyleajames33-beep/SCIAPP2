'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Zap, Play, Rocket, Shield, Skull, Mountain } from 'lucide-react'
import { GameMode, Question } from '@/lib/game-types'
import { getModeDisplay } from '@/lib/game-config'

type ProgressBarProps = {
  gameMode: GameMode
  currentQuestionIndex: number
  totalQuestions: number
  questionsAnswered: number
  hasDoublePoints: boolean
  topic: string
}

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  classic: <Play className="w-4 h-4" />,
  rush: <Rocket className="w-4 h-4" />,
  survival: <Shield className="w-4 h-4" />,
  boss_battle: <Skull className="w-4 h-4" />,
  tower_climb: <Mountain className="w-4 h-4" />,
}

export function ProgressBar({
  gameMode,
  currentQuestionIndex,
  totalQuestions,
  questionsAnswered,
  hasDoublePoints,
  topic
}: ProgressBarProps) {
  const modeInfo = getModeDisplay(gameMode)
  const progress = gameMode === 'survival' 
    ? 100 // Always full for survival
    : ((currentQuestionIndex + 1) / totalQuestions) * 100

  return (
    <>
      {/* Mode Badge */}
      <div className="flex justify-center mb-4">
        <Badge className={`bg-gradient-to-r ${modeInfo?.color} text-white px-4 py-1 text-sm`}>
          {MODE_ICONS[gameMode]}
          <span className="ml-2">{modeInfo?.name} Mode</span>
        </Badge>
      </div>

      {/* Progress Card */}
      <Card className="bg-white/95 backdrop-blur shadow-lg border-0 mb-4">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">
              {gameMode === 'survival' 
                ? `Question ${questionsAnswered + 1}` 
                : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`
              }
            </span>
            <div className="flex items-center gap-2">
              {hasDoublePoints && (
                <Badge className="bg-yellow-500 text-white animate-pulse">
                  <Zap className="w-3 h-3 mr-1" /> 2x Active
                </Badge>
              )}
              <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                {topic || 'Chemistry'}
              </Badge>
            </div>
          </div>
          {gameMode !== 'survival' && <Progress value={progress} className="h-3" />}
        </CardContent>
      </Card>
    </>
  )
}
