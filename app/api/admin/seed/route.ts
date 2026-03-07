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

// Note: using native Response instead of NextResponse to avoid a 14.2.x
// SWC module-alias bug that can't resolve 'next/dist/server/web/exports/next-response'
import { supabaseAdmin } from '@/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

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

// DEBUG: Check env vars at module load time
console.log("DEBUG: URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("DEBUG: Service Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// ─── Route handler ─────────────────────────────────────────────────────────

export async function GET() {
  console.log("DIAGNOSTIC: URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("DIAGNOSTIC: Key Prefix =", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10));
  console.log("DIAGNOSTIC: Node Version =", process.version);
  try {
    // ── Validate env ──────────────────────────────────────────────────────────
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      return json(
        {
          success: false,
          error:
            'Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. ' +
            'Add them to .env.local and restart the dev server.',
        },
        500
      )
    }

    // Use the service role key so the insert can bypass Row-Level Security
    // Using supabaseAdmin from lib/supabase.ts

    // ── Load JSON ─────────────────────────────────────────────────────────────
    // process.cwd() is the chemquest/ project root when Next.js is running
    const jsonPath = path.join(process.cwd(), 'data', 'chemistry_questions.json')

    let questions: RawQuestion[]
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      questions = raw.questions ?? []
    } catch (e) {
      return json(
        { success: false, error: `Could not read questions file: ${(e as Error).message}` },
        500
      )
    }

    if (questions.length === 0) {
      return json({ success: false, error: 'No questions found in JSON.' }, 400)
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

      const { error } = await supabaseAdmin
        .from('Question')
        .upsert(batch, { onConflict: 'id' })

      if (error) {
        return json(
          {
            success: false,
            error: error.message,
            insertedSoFar: count,
          },
          500
        )
      }

      count += batch.length
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    return json({ success: true, count })
  } catch (error: any) {
    return json(
      { 
        error: error.message, 
        stack: error.stack, 
        hint: "Check Supabase Keys" 
      },
      500
    );
  }
}
