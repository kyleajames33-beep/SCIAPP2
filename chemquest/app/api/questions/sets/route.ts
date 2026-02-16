import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Get question sets (public sets + user's own sets)
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    const { searchParams } = new URL(req.url)
    const includeDefault = searchParams.get('includeDefault') === 'true'

    const whereClause: Record<string, unknown> = {
      OR: [
        { isPublic: true },
        ...(user ? [{ creatorId: user.id }] : []),
      ],
    }

    const questionSets = await prisma.questionSet.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Count default questions (questions without a questionSetId)
    let defaultSet = null
    if (includeDefault) {
      const defaultQuestionsCount = await prisma.question.count({
        where: { questionSetId: null },
      })

      if (defaultQuestionsCount > 0) {
        defaultSet = {
          id: null,
          name: 'HSC Chemistry Module 1',
          description: 'Default question set covering Properties and Structure of Matter',
          subject: 'Chemistry',
          module: 'Module 1',
          isPublic: true,
          creatorId: null,
          creator: { username: 'system', displayName: 'ChemQuest' },
          _count: { questions: defaultQuestionsCount },
          createdAt: null,
        }
      }
    }

    const sets = defaultSet ? [defaultSet, ...questionSets] : questionSets

    return NextResponse.json({
      sets: sets.map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        subject: set.subject,
        module: set.module,
        isPublic: set.isPublic,
        creatorUsername: set.creator?.username || 'system',
        creatorDisplayName: set.creator?.displayName || 'ChemQuest',
        questionCount: set._count?.questions || 0,
        isOwned: user ? set.creatorId === user.id : false,
      })),
    })
  } catch (error) {
    console.error('Get question sets error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question sets' },
      { status: 500 }
    )
  }
}
