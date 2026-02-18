/**
 * GET /api/admin/seed
 *
 * Temporary admin route to seed the Supabase "Question" table with
 * all questions from chemquest/data/chemistry_questions.json.
 *
 * IMPORTANT: Remove or gate this route behind auth before going to
 * production. Anyone who can reach this URL can trigger a full re-seed.
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL      — your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY     — service role key (bypasses RLS)
 *
 * Returns:
 *   { success: true,  count: 339 }
 *   { success: false, error: "...", insertedSoFar: N }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Types ─────────────────────────────────────────────────────────────────

interface RawQuestion {
  id: string
  question: string
  options: [string, string, string, string]
  correctAnswer: number
  topic: string
  difficulty: string
  explanation?: string
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET() {
  // ── Validate env ──────────────────────────────────────────────────────────
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. ' +
          'Add them to .env.local and restart the dev server.',
      },
      { status: 500 }
    )
  }

  // Use the service role key so the insert can bypass Row-Level Security
  const supabase = createClient(url, key)

  // ── Load JSON ─────────────────────────────────────────────────────────────
  // process.cwd() is the chemquest/ project root when Next.js is running
  const jsonPath = path.join(process.cwd(), 'data', 'chemistry_questions.json')

  let questions: RawQuestion[]
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    questions = raw.questions ?? []
  } catch (e) {
    return NextResponse.json(
      { success: false, error: `Could not read questions file: ${(e as Error).message}` },
      { status: 500 }
    )
  }

  if (questions.length === 0) {
    return NextResponse.json({ success: false, error: 'No questions found in JSON.' }, { status: 400 })
  }

  // ── Map JSON → DB columns ─────────────────────────────────────────────────
  const rows = questions.map((q) => ({
    id: q.id,
    question: q.question,
    optionA: q.options[0] ?? '',
    optionB: q.options[1] ?? '',
    optionC: q.options[2] ?? '',
    optionD: q.options[3] ?? '',
    correctAnswer: q.correctAnswer ?? 0,
    subject: 'Chemistry',
    topic: q.topic ?? 'General',
    difficulty: q.difficulty ?? 'Foundation',
    explanation: q.explanation ?? null,
    questionSetId: null, // global pool — not linked to a teacher set
  }))

  // ── Upsert in batches of 100 ──────────────────────────────────────────────
  const BATCH_SIZE = 100
  let count = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('Question')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          insertedSoFar: count,
        },
        { status: 500 }
      )
    }

    count += batch.length
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  return NextResponse.json({ success: true, count })
}
