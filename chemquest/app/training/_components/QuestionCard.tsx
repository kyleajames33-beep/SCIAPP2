'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Lightbulb } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Question } from '@/lib/game-types'

type QuestionCardProps = {
  question: Question | undefined
  questionIndex: number
  selectedAnswer: number | null
  isAnswered: boolean
  hiddenOptions: number[]
  explanation?: string | null
  onSelectAnswer: (index: number) => void
}

export function QuestionCard({
  question,
  questionIndex,
  selectedAnswer,
  isAnswered,
  hiddenOptions,
  explanation,
  onSelectAnswer
}: QuestionCardProps) {
  if (!question) return null
  
  const options = [
    question.optionA,
    question.optionB,
    question.optionC,
    question.optionD,
  ]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/95 backdrop-blur shadow-2xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl text-gray-900 leading-relaxed">
              {question.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((option, index) => {
              if (hiddenOptions.includes(index)) return null
              
              const isSelected = selectedAnswer === index
              const isCorrect = index === question.correctAnswer
              const showResult = isAnswered

              let buttonClass = 'w-full justify-start text-left h-auto py-4 px-5 text-base rounded-xl transition-all '
              
              if (showResult) {
                if (isCorrect) {
                  buttonClass += 'bg-green-500 border-2 border-green-600 text-white shadow-lg'
                } else if (isSelected) {
                  buttonClass += 'bg-red-500 border-2 border-red-600 text-white shadow-lg'
                } else {
                  buttonClass += 'bg-gray-100 border-2 border-gray-200 text-gray-500'
                }
              } else if (isSelected) {
                buttonClass += 'bg-purple-100 border-2 border-purple-500 text-gray-900 shadow-md'
              } else {
                buttonClass += 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 hover:border-purple-400 hover:shadow-md'
              }

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: isAnswered ? 1 : 1.02 }}
                  whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                >
                  <Button
                    onClick={() => onSelectAnswer(index)}
                    disabled={isAnswered}
                    className={buttonClass}
                  >
                    <span className={`font-bold mr-3 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      showResult && isCorrect ? 'bg-green-600' :
                      showResult && isSelected ? 'bg-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {['A', 'B', 'C', 'D'][index]}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrect && (
                      <Sparkles className="w-5 h-5 ml-2" />
                    )}
                  </Button>
                </motion.div>
              )
            })}

            {/* Explanation (shown after answering) */}
            {isAnswered && explanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-800 mb-1">Explanation</p>
                    <p className="text-blue-700 text-sm">{explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
