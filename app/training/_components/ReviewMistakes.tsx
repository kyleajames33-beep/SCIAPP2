'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react'

// Interface matching the ChemistryQuestion structure
interface MissedQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  userAnswer: number
  topic: string
  difficulty: string
  explanation: string
  worldId: number
  chamberId: string
}

interface ReviewMistakesProps {
  missedQuestions: MissedQuestion[]
  onClose: () => void
  onRetry?: () => void
}

export function ReviewMistakes({ 
  missedQuestions, 
  onClose,
  onRetry 
}: ReviewMistakesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  if (missedQuestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <Card className="bg-black/60 border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Perfect Score!</h2>
            <p className="text-white/60 mb-6">
              You didn't miss any questions. Great job!
            </p>
            <Button onClick={onClose} className="w-full">
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Results
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const currentQuestion = missedQuestions[currentIndex]
  const progress = ((currentIndex + 1) / missedQuestions.length) * 100

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      'Foundation': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Developing': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Proficient': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Mastery': 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    }
    return colors[difficulty] || 'bg-gray-500/20 text-gray-300'
  }

  const getOptionStyle = (index: number) => {
    if (index === currentQuestion.correctAnswer) {
      return 'border-green-500/50 bg-green-500/10 text-green-300'
    }
    if (index === currentQuestion.userAnswer) {
      return 'border-red-500/50 bg-red-500/10 text-red-300'
    }
    return 'border-white/10 bg-white/5 text-white/50'
  }

  const getOptionIcon = (index: number) => {
    if (index === currentQuestion.correctAnswer) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />
    }
    if (index === currentQuestion.userAnswer) {
      return <XCircle className="w-5 h-5 text-red-400" />
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="bg-black/60 border-white/10 backdrop-blur-xl w-full max-w-3xl max-h-[90vh] flex flex-col relative">
        {/* Header */}
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  Review Mistakes
                </CardTitle>
                <p className="text-white/50 text-sm mt-1">
                  Question {currentIndex + 1} of {missedQuestions.length}
                </p>
              </div>
            </div>
            <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
              {currentQuestion.difficulty}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-hidden p-6">
          <ScrollArea className="h-full pr-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Question */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <p className="text-lg text-white leading-relaxed">
                      {currentQuestion.question}
                    </p>
                  </div>
                  <p className="text-white/40 text-sm mt-3 ml-8">
                    Topic: {currentQuestion.topic} • Module {currentQuestion.worldId}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <p className="text-white/60 text-sm font-medium">Your Answer vs. Correct Answer:</p>
                  {currentQuestion.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`
                        flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                        ${getOptionStyle(index)}
                      `}
                    >
                      {getOptionIcon(index)}
                      <span className={`
                        flex-1
                        ${index === currentQuestion.correctAnswer 
                          ? 'text-green-300 font-medium' 
                          : index === currentQuestion.userAnswer 
                            ? 'text-red-300' 
                            : 'text-white/70'
                        }
                      `}>
                        {option}
                      </span>
                      {index === currentQuestion.userAnswer && index !== currentQuestion.correctAnswer && (
                        <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                          Your Answer
                        </Badge>
                      )}
                      {index === currentQuestion.correctAnswer && (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                          Correct
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Explanation Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                </Button>

                {/* Explanation */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="w-5 h-5 text-yellow-400" />
                          <h4 className="text-white font-semibold">Explanation</h4>
                        </div>
                        <p className="text-white/80 leading-relaxed">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </ScrollArea>
        </CardContent>

        {/* Footer Navigation */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(prev => prev - 1)
                setShowExplanation(false)
              }}
              disabled={currentIndex === 0}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>

            <div className="flex items-center gap-2">
              {missedQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx)
                    setShowExplanation(false)
                  }}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${idx === currentIndex 
                      ? 'bg-purple-400 w-6' 
                      : 'bg-white/20 hover:bg-white/40'
                    }
                  `}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setCurrentIndex(prev => prev + 1)
                setShowExplanation(false)
              }}
              disabled={currentIndex === missedQuestions.length - 1}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry These Questions
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Close Review
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
