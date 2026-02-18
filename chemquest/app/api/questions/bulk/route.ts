import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ImportQuestion {
  text: string
  options: string[] // Array of 4 options [A, B, C, D]
  correctAnswer: number // 0-3
  subject?: string
  topic?: string
  difficulty?: string
  explanation?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { questions } = body as { questions: ImportQuestion[] }

    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions array is required' },
        { status: 400 }
      )
    }

    // Validate and transform questions
    const transformedQuestions = questions.map((q, index) => {
      // Validate required fields
      if (!q.text || !q.options || q.options.length !== 4) {
        throw new Error(`Question ${index + 1}: Missing text or invalid options (must have exactly 4 options)`)
      }

      if (q.correctAnswer === undefined || q.correctAnswer < 0 || q.correctAnswer > 3) {
        throw new Error(`Question ${index + 1}: correctAnswer must be 0, 1, 2, or 3`)
      }

      return {
        question: q.text,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctAnswer: q.correctAnswer,
        subject: q.subject || 'Chemistry',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'medium',
        explanation: q.explanation || null,
      }
    })

    // Bulk insert questions (SQLite doesn't support skipDuplicates)
    const result = await prisma.question.createMany({
      data: transformedQuestions,
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully imported ${result.count} questions`,
    })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import questions',
        success: false
      },
      { status: 500 }
    )
  }
}
