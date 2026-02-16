'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Beaker, Sparkles, Home, Play, Rocket, Shield, BookOpen, Loader2, Skull, Mountain, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GameMode } from '@/lib/game-types'
import { GAME_MODE_DISPLAY } from '@/lib/game-config'

interface QuestionSet {
  id: string | null
  name: string
  description: string | null
  questionCount: number
  creatorDisplayName: string
}

type ModeSelectProps = {
  onSelectMode: (mode: GameMode, questionSetId?: string | null) => void
  onCustomize?: () => void
}

const MODE_ICONS: Record<GameMode, React.ReactNode> = {
  classic: <Play className="w-8 h-8" />,
  rush: <Rocket className="w-8 h-8" />,
  survival: <Shield className="w-8 h-8" />,
  boss_battle: <Skull className="w-8 h-8" />,
  tower_climb: <Mountain className="w-8 h-8" />,
}

export function ModeSelect({ onSelectMode, onCustomize }: ModeSelectProps) {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null)
  const [isLoadingSets, setIsLoadingSets] = useState(true)

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const response = await fetch('/api/questions/sets?includeDefault=true')
        const data = await response.json()
        setQuestionSets(data.sets || [])
        // Select default set by default
        if (data.sets?.length > 0) {
          setSelectedSetId(data.sets[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch question sets:', error)
      } finally {
        setIsLoadingSets(false)
      }
    }
    fetchSets()
  }, [])

  const selectedSet = questionSets.find(s => s.id === selectedSetId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="flex justify-center mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="relative">
              <Beaker className="w-16 h-16 text-white" />
              <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">ChemQuest</h1>
          <p className="text-white/80">Choose your game mode</p>
        </div>

        {/* Question Set Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-white" />
                <span className="text-white font-medium">Question Set</span>
              </div>
              {isLoadingSets ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              ) : (
                <Select
                  value={selectedSetId || 'default'}
                  onValueChange={(value) => setSelectedSetId(value === 'default' ? null : value)}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select a question set" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionSets.map((set) => (
                      <SelectItem key={set.id || 'default'} value={set.id || 'default'}>
                        <div className="flex items-center gap-2">
                          <span>{set.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({set.questionCount} questions)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedSet && (
                <p className="text-white/60 text-sm mt-2">
                  {selectedSet.description || `${selectedSet.questionCount} questions by ${selectedSet.creatorDisplayName}`}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {GAME_MODE_DISPLAY.map((mode) => (
            <motion.div
              key={mode.id}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="bg-white/95 backdrop-blur border-0 shadow-xl cursor-pointer hover:shadow-2xl transition-all h-full"
                onClick={() => onSelectMode(mode.id, selectedSetId)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mode.color} flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                    {MODE_ICONS[mode.id]}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{mode.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{mode.description}</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {mode.details.map((detail, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {detail}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={onCustomize}
          >
            <User className="mr-2 w-4 h-4" />
            Customize Character
          </Button>
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Home className="mr-2 w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
