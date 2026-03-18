import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Mapping from campaign chamber IDs to question chamber IDs
const CHAMBER_CONFIG: Record<string, string> = {
  'm1-c1': 'atomic-structure-and-periodicity',
  'm1-c2': 'chemical-bonding', 
  'm1-c3': 'intermolecular-forces',
  'm1-c4': 'states-of-matter',
  'm2-c1': 'the-mole-concept',
  'm2-c2': 'stoichiometry',
  'm2-c3': 'concentration-calculations', 
  'm2-c4': 'gas-laws',
  'm3-c1': 'reaction-types',
  'm3-c2': 'reaction-rates',
  'm3-c3': 'energy-changes-in-reactions',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const count = Math.min(parseInt(searchParams.get('count') || '15'), 50)
  const questionSetId = searchParams.get('questionSetId')
  const chamberId = searchParams.get('chamberId')

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let query = db
    .from('Question')
    .select('id, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, topic, difficulty')

  // Priority: questionSetId > chamberId mapping
  if (questionSetId) {
    query = query.eq('questionSetId', questionSetId)
  } else if (chamberId) {
    // Handle both campaign chamber IDs (m1-c1) and question chamber IDs directly
    const questionChamberId = CHAMBER_CONFIG[chamberId] || chamberId;
    query = query.eq('chamberId', questionChamberId)
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
