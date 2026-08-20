# call-eval

A coaching-call QC evaluator. Paste a transcript, pick **kick-off** or **coaching**,
and it scores the call against a 12-dimension rubric with an LLM. Every run gets a
permanent URL at `/run/[id]`, and scoring runs server-side so it survives closing
the tab.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Postgres) for persistence
- OpenRouter (OpenAI-compatible SDK) for scoring
- jsPDF for client-side PDF export

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase** — create a project, then run `supabase-schema.sql` in the SQL editor.
   It creates the `evaluations` table with RLS wide open (no auth for this exercise).

3. **Env** — copy the example and fill it in:
   ```bash
   cp .env.local.example .env.local
   ```
   | var | what |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server only) |
   | `OPENROUTER_API_KEY` | OpenRouter key |
   | `OPENROUTER_MODEL` | model id, default `anthropic/claude-sonnet-4-6` |

4. **Run**
   ```bash
   npm run dev
   ```

## How it works

- `POST /api/evaluate` validates the input, inserts a row with status `processing`,
  then fires the LLM scoring as a **detached promise** (not awaited) and returns
  `{ id }` immediately. That's what lets scoring finish even if the user closes the
  tab. The route sets `maxDuration = 120` for the Vercel function budget.
- `GET /api/evaluations/[id]` returns the row (without the large transcript). The
  results page polls it every 2s until `completed` or `failed`.
- `src/lib/scorer.ts` calls OpenRouter with the **full rubric + full transcript +
  the exact JSON schema**. The rubrics are TypeScript template-literal exports
  (`src/lib/kickoff-rubric.ts`, `src/lib/coaching-rubric.ts`) so they bundle for
  Vercel — they are never read from the filesystem. The response is fence-stripped,
  parsed, and validated (12 dimensions required).
- All external clients (Supabase, OpenRouter) are **lazy-initialized** so the build
  doesn't need env vars.

## Rubrics

`src/lib/kickoff-rubric.ts` and `src/lib/coaching-rubric.ts` are generated from the
`rubrics/*.md` files in `lukecala/hiring-ai-dev-exercise` (backticks and `${` escaped).
