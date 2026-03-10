import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const count = Math.min(parseInt(searchParams.get('count') || '15'), 50)
  const questionSetId = searchParams.get('questionSetId')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let query = db
    .from('Question')
    .select('id, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic, difficulty')

  if (questionSetId) {
    query = query.eq('questionSetId', questionSetId)
  }

  // Fetch a larger pool then shuffle client-side for randomness
  const { data, error } = await query.limit(count * 4)

  if (error) {
    console.error('[QUESTIONS] Supabase error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }

  const shuffled = (data || [])
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((q: any) => ({
      id: q.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      topic: q.topic,
      difficulty: q.difficulty,
    }))

  return NextResponse.json({ questions: shuffled })
}
