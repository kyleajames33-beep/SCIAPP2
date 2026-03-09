import { Suspense } from 'react'
import QuizGame from './_components/quiz-game'

export default function TrainingPage() {
  return (
    <Suspense fallback={null}>
      <QuizGame />
    </Suspense>
  )
}
