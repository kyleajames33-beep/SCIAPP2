import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: sets, error } = await supabaseAdmin
      .from('QuestionSet')
      .select('id, name, description, subject, module, isPublic, creatorId, createdAt')
      .eq('isPublic', true)
      .order('id', { ascending: true })

    if (error) {
      console.error('[QUESTIONS_SETS] Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
    }

    const mapped = (sets || []).map((set: {
      id: string
      name: string
      description: string | null
      subject: string
      module: string | null
      isPublic: boolean
      creatorId: string
    }) => ({
      id: set.id,
      name: set.name,
      description: set.description,
      subject: set.subject,
      module: set.module,
      isPublic: set.isPublic,
      creatorUsername: 'chemquest_system',
      creatorDisplayName: 'ChemQuest',
      questionCount: 0,
      isOwned: false,
    }))

    return NextResponse.json({ data: mapped, sets: mapped })
  } catch (err) {
    console.error('[QUESTIONS_SETS] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch question sets' }, { status: 500 })
  }
}
