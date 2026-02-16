import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ImportedQuestion {
  question: string
  options: string[]
  correctAnswer: number
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is teacher or admin
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers and admins can import questions' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, module, subject, isPublic, questions } = body

    // Validation
    if (!name || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'Name and questions array are required' },
        { status: 400 }
      )
    }

    // Validate each question
    const validQuestions: ImportedQuestion[] = []
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      if (!q.question || typeof q.question !== 'string') {
        return NextResponse.json(
          { error: `Question ${i + 1}: Missing question text` },
          { status: 400 }
        )
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        return NextResponse.json(
          { error: `Question ${i + 1}: Must have exactly 4 options` },
          { status: 400 }
        )
      }

      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        return NextResponse.json(
          { error: `Question ${i + 1}: correctAnswer must be 0, 1, 2, or 3` },
          { status: 400 }
        )
      }

      if (!q.topic || typeof q.topic !== 'string') {
        return NextResponse.json(
          { error: `Question ${i + 1}: Missing topic` },
          { status: 400 }
        )
      }

      if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        return NextResponse.json(
          { error: `Question ${i + 1}: difficulty must be 'easy', 'medium', or 'hard'` },
          { status: 400 }
        )
      }

      validQuestions.push(q)
    }

    // Create question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name,
        description: description || null,
        module: module || null,
        subject: subject || 'Chemistry',
        isPublic: isPublic || false,
        creatorId: user.id,
      },
    })

    // Create questions linked to the set
    const createdQuestions = await prisma.question.createMany({
      data: validQuestions.map(q => ({
        question: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctAnswer: q.correctAnswer,
        topic: q.topic,
        difficulty: q.difficulty,
        explanation: q.explanation || null,
        questionSetId: questionSet.id,
      })),
    })

    return NextResponse.json(
      {
        questionSetId: questionSet.id,
        questionsImported: createdQuestions.count,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Question import error:', error)
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    )
  }
}
