import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Get teacher's own question sets with full questions
export async function GET() {
  try {
    const user = await getSessionUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only teachers and admins can access this' },
        { status: 403 }
      )
    }

    const questionSets = await prisma.questionSet.findMany({
      where: { creatorId: user.id },
      include: {
        questions: {
          select: {
            id: true,
            question: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctAnswer: true,
            topic: true,
            difficulty: true,
            explanation: true,
          },
        },
        _count: {
          select: { gameSessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      sets: questionSets.map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        subject: set.subject,
        module: set.module,
        isPublic: set.isPublic,
        questionCount: set.questions.length,
        timesPlayed: set._count.gameSessions,
        questions: set.questions,
        createdAt: set.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Get teacher sets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question sets' },
      { status: 500 }
    )
  }
}
