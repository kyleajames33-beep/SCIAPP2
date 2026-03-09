import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: sets, error } = await supabaseAdmin
      .from('QuestionSet')
      .select(`
        id,
        name,
        description,
        subject,
        module,
        isPublic,
        creatorId,
        createdAt
      `)
      .eq('isPublic', true)
      .order('id', { ascending: true })

    if (error) {
      console.error('[QUESTIONS_SETS] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
    }

    // Get question counts per set
    const { data: counts, error: countError } = await supabaseAdmin
      .from('Question')
      .select('questionSetId')
      .not('questionSetId', 'is', null)

    const countMap: Record<string, number> = {}
    if (!countError && counts) {
      for (const q of counts) {
        if (q.questionSetId) {
          countMap[q.questionSetId] = (countMap[q.questionSetId] || 0) + 1
        }
      }
    }

    return NextResponse.json({
      data: (sets || []).map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        subject: set.subject,
        module: set.module,
        isPublic: set.isPublic,
        creatorUsername: 'chemquest_system',
        creatorDisplayName: 'ChemQuest',
        questionCount: countMap[set.id] || 0,
        isOwned: false,
      })),
      // Also expose as `sets` for legacy frontend compatibility
      sets: (sets || []).map(set => ({
        id: set.id,
        name: set.name,
        description: set.description,
        subject: set.subject,
        module: set.module,
        isPublic: set.isPublic,
        creatorUsername: 'chemquest_system',
        creatorDisplayName: 'ChemQuest',
        questionCount: countMap[set.id] || 0,
        isOwned: false,
      })),
    })
  } catch (error) {
    console.error('[QUESTIONS_SETS] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
  }
}
