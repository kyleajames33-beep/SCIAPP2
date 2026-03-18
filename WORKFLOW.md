# WORKFLOW.md — ChemQuest Development Workflow
> How we work on this project. Read alongside CLAUDE.md (project rules) and the
> relevant phase doc. This file covers process; CLAUDE.md covers facts.

---

## Tools Available

| Tool | Purpose | How to activate |
|------|---------|----------------|
| **Context7** | Live library docs (Phaser, Supabase, Next.js, Framer Motion) | Add `use context7` to any prompt |
| **CLAUDE.md** | Project rules — auto-loaded every session | Always present |
| **Memory files** | Cross-session context | Auto-loaded when relevant |
| **`/simplify`** | Review changed code for over-engineering | Run after each sub-phase |
| **Ralph** | Long autonomous execution sessions | Install when starting Phase 6+ |

---

## Session Start Ritual

Every session, in this order:

1. **Read CLAUDE.md** — auto-loaded, but skim the "Critical Architecture Rules" section
2. **Read the target phase doc** (`roadmap/PHASE_XX.md`) — check PROGRESS TRACKER first
3. **Read every file in the pre-read checklist** — do not skip, do not assume state is unchanged
4. **Confirm current state matches phase doc** — if anything is different, investigate before writing code

> If you find a discrepancy between what the phase doc says and what's actually in the file,
> update the phase doc to reflect reality before proceeding. Never code against a false assumption.

---

## Before Writing Any Code

Ask and answer each of these:

- [ ] Have I read every file listed in this sub-phase's pre-read checklist?
- [ ] Does the current file state match what the phase doc says it should be?
- [ ] Do I know exactly which lines I'm changing and why?
- [ ] Could this change affect any other phase's pre-read checklist? (If yes, note it)
- [ ] Is Context7 needed here? (Phaser API, Supabase v2, Next.js App Router patterns → yes)

**Context7 trigger points by phase:**

| Phase | When to use Context7 |
|-------|---------------------|
| 3 | Next.js App Router dynamic routes, params |
| 6 | Supabase upsert onConflict, maybeSingle vs single |
| 7 | Supabase SQL query syntax |
| 8 | Phaser 3 Scale.FIT, input.touch.capture |
| 9 | Framer Motion AnimatePresence, React error boundaries |
| 10 | Next.js metadata/viewport export, Vercel deployment config |

Usage: prefix your question with `use context7` —
```
use context7
What is the correct Phaser 3 Scale.FIT behaviour when the CSS container
is narrower than the game's internal resolution?
```

---

## The Coding Loop

### 1. Read first, always
Never edit a file you haven't read in this session. File state changes between sessions.

### 2. Make the minimal change
- Fix the specific thing the task asks for
- Do not refactor surrounding code
- Do not add comments to lines you didn't change
- Do not add error handling for scenarios that can't happen
- Three similar lines of code is better than a premature abstraction

### 3. After each change, verify TypeScript
```bash
npx tsc --noEmit
```
Do not proceed to the next task with TypeScript errors. Fix them now, in the same file.

### 4. Browser smoke test
Open the relevant page in DevTools. Verify the specific thing you just changed works.
Do not rely on "it compiles" as evidence of correctness.

### 5. The quality gate — before marking ✅
Ask: **"Would a staff engineer approve this?"**

If the answer is uncertain, use the elegant pivot:
> *"Knowing everything you know now, scrap this and implement the elegant solution."*

This is not about perfection — it's about catching the obvious improvements before they
accumulate into debt. Use it once per sub-phase after the first working version.

### 6. Prove it works
Before marking any checkpoint complete, apply the "prove it" test:
> *"Prove to me this works."*

Walk through each item in the checkpoint's pass criteria. For database writes, open
Supabase table editor and verify the row. For UI changes, screenshot the result. For
API endpoints, show the response JSON.

---

## When Things Go Sideways

**Stop. Do not push through.**

1. Re-read the phase doc for the current sub-phase
2. Re-read the specific files involved
3. Ask: is this a wrong assumption in the phase doc, or a wrong implementation?
   - **Wrong assumption in doc** → update the doc, then implement correctly
   - **Wrong implementation** → revert, understand the root cause, try again
4. If still blocked after two attempts: surface the blocker explicitly rather than working around it

**Never:**
- Use `// @ts-ignore` or `eslint-disable` to silence errors and keep moving
- Delete a failing test to make the build pass
- Use `window.location.reload()` as a fix for state management problems
- Commit half-working code with "will fix later" comments

---

## Escalation Rules

| Situation | Action |
|-----------|--------|
| Phase doc says file X exists but it doesn't | Stop — document the gap, check if a prior phase was skipped |
| Supabase query returns 0 rows when expecting data | Stop — run the SQL verification query from the phase doc before any code change |
| `npx tsc --noEmit` shows 20+ errors | Stop — do not remove `ignoreBuildErrors` yet. Fix errors file-by-file, most important first |
| auth-me Edge Function unreachable | Stop — check Supabase Edge Function logs before assuming a code bug |
| Phase dependency not met | Stop — do not start Phase N if Phase N-1's checkpoint hasn't passed |

---

## Session End Ritual

Every session, before closing:

1. **Update PROGRESS TRACKER** in the phase doc:
   - ✅ sub-phase complete
   - 🔄 sub-phase in progress
   - ⬜ not started
2. **Add a STOPPED AT note** if mid-sub-phase:
   ```
   STOPPED AT: Task 6.2.3 — session ref pattern written, not yet tested
   ```
3. **Run `npx tsc --noEmit`** — do not leave TypeScript errors between sessions
4. **Update CLAUDE.md** if you discovered a new rule during this session:
   > After any correction or surprise, add a rule to CLAUDE.md so it never happens again.
   > The format: add it to the most relevant section. One clear sentence. No caveats.
5. **Stage only complete sub-phases** — do not commit partial work

---

## CLAUDE.md Update Trigger

After ANY of these events, update CLAUDE.md immediately:

| Event | What to add |
|-------|------------|
| You corrected a wrong approach | Add the correct approach as a rule |
| A predicted problem actually occurred | Add the mitigation as a permanent rule |
| You discovered a field name difference between files | Add the correct field name to the relevant section |
| A phase doc assumption turned out to be wrong | Add the correct assumption |
| An API behaved differently than expected | Add the correct usage pattern |

**Format:** Add to the most relevant section in CLAUDE.md. One rule per discovery.
Keep it specific — "always use `maybeSingle()` when checking for optional row" is better
than "be careful with Supabase queries."

---

## Phase Transition Gate

Before marking a phase COMPLETE and starting the next one, ALL of these must be true:

- [ ] Every sub-phase checkpoint has passed (all items checked ✅)
- [ ] `npx tsc --noEmit` exits with 0 errors
- [ ] Full browser smoke test from the phase's "full loop test script" passes
- [ ] PROGRESS TRACKER updated to ✅ for all sub-phases
- [ ] No `console.error` output during the smoke test
- [ ] Any new rules discovered added to CLAUDE.md

If a phase is only 90% complete but the last 10% is blocked, document the blocker
explicitly in the PROGRESS TRACKER before moving on. Do not silently skip items.

---

## Multi-Phase Execution Strategy

Phases have dependencies. The dependency chain is:

```
1 (Battle Core) → 2 (Phaser) → 3 (Campaign) → 4 (Auth) → 5 (Leaderboard)
                                                    ↓
                                               6 (Rewards)
                                                    ↓
                                               7 (Content)
                                                    ↓
                                               8 (Mobile) ← can start after Phase 1
                                                    ↓
                                               9 (Polish)
                                                    ↓
                                              10 (Production)
```

Phase 8 (mobile) only requires Phase 1 to be complete — it's mostly CSS/layout.
If you want to work on mobile fixes while Phase 2–7 are in progress, that is valid.

**When context runs out mid-phase:**
The phase doc's CONTEXT WINDOW SURVIVAL PROTOCOL section handles this. Follow it exactly.
Do not re-read files already marked complete in the PROGRESS TRACKER.

---

## Working with Subagents

Use the `Explore` or `general-purpose` agent for:
- Searching for all usages of a pattern across the codebase (`grep -r "submitBossAttempt"`)
- Verifying question counts in multiple chamberIds at once
- Reading 3+ files in parallel to establish current state before a complex task

Do not use subagents for:
- Writing code (always in main context where you can verify)
- Making edits (same reason)
- Tasks where the result needs to directly inform the next code change

---

## Prompt Patterns That Work

**For a stuck implementation:**
> "Knowing everything you know now, scrap this and implement the elegant solution."

**For a passing but messy checkpoint:**
> "This works. Now prove to me it's correct, then tell me if there's a simpler version."

**For verifying understanding before a risky change:**
> "Before I touch this, explain to me exactly what [function/component] currently does and what will break if I change [specific thing]."

**For library-specific questions:**
> "use context7 — [specific question about Phaser/Supabase/Next.js API]"

**For a bug that isn't obvious:**
> "Point at the exact line that causes this. Don't fix it yet — just show me where it is and why."
