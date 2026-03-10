/**
 * seed-supabase.ts
 * Standalone script to seed the Supabase "Question" table from
 * chemquest/data/chemistry_questions.json.
 *
 * Usage (from the chemquest/ directory):
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx ts-node --project tsconfig.json scripts/seed-supabase.ts
 *
 * Requires the SERVICE ROLE key (not the anon key) so the insert
 * can bypass Row-Level Security policies on the Question table.
 *
 * The script is idempotent: it upserts on the question `id` field,
 * so running it multiple times will not create duplicates.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawQuestion {
  id: string
  question: string
  options: [string, string, string, string]
  correctAnswer: number
  topic: string
  difficulty: string
  worldId?: number
  chamberId?: string
  explanation?: string
  tags?: string[]
}

interface QuestionRow {
  id: string
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: number
  subject: string
  topic: string
  difficulty: string
  explanation: string | null
}

// ─── Client ───────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ─── Field mapper ─────────────────────────────────────────────────────────────

function toRow(q: RawQuestion): QuestionRow {
  return {
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
    // NOTE: questionSetId is intentionally omitted — upsert will not overwrite
    // existing questionSetId values set by migration scripts.
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const jsonPath = path.join(__dirname, '..', 'data', 'chemistry_questions.json')
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const questions: RawQuestion[] = raw.questions ?? []

  if (questions.length === 0) {
    console.log('No questions found in JSON. Exiting.')
    return
  }

  console.log(`Found ${questions.length} questions. Starting upsert...`)

  const rows = questions.map(toRow)

  // Upsert in batches of 100 to stay within Supabase payload limits
  const BATCH_SIZE = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('Question')
      .upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`Error on batch starting at index ${i}:`, error.message)
      process.exit(1)
    }

    inserted += batch.length
    console.log(`  ✓ ${inserted} / ${rows.length}`)
  }

  console.log(`\nDone! ${inserted} questions seeded into Supabase.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
