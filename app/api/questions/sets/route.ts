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
    const { data: sets, error } = await db.rpc('get_question_sets_with_counts')

    if (error) {
      console.error('[QUESTIONS_SETS] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
    }

    const mapped = (sets || []).map((set: any) => ({
      id: set.id,
      name: set.name,
      description: set.description,
      subject: set.subject,
      module: set.module,
      isPublic: set.is_public,
      creatorUsername: 'chemquest_system',
      creatorDisplayName: 'ChemQuest',
      questionCount: set.question_count,
      isOwned: false,
    }))

    return NextResponse.json({ data: mapped, sets: mapped })
  } catch (err) {
    console.error('[QUESTIONS_SETS] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
  }
}
