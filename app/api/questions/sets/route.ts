import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const { data: sets, error } = await db
      .from('QuestionSet')
      .select('id, name, description, subject, module, isPublic')
      .eq('isPublic', true)
      .order('id', { ascending: true })

    if (error) {
      console.error('[QUESTIONS_SETS] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
    }

    // Get counts separately
    const { data: counts } = await db
      .from('Question')
      .select('questionSetId')
      .not('questionSetId', 'is', null)

    const countMap: Record<string, number> = {}
    for (const q of counts || []) {
      if (q.questionSetId) {
        countMap[q.questionSetId] = (countMap[q.questionSetId] || 0) + 1
      }
    }

    const mapped = (sets || []).map((set: any) => ({
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
    }))

    return NextResponse.json({ data: mapped, sets: mapped })
  } catch (err) {
    console.error('[QUESTIONS_SETS] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
  }
}
