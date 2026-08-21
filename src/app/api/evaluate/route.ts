import { after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { scoreTranscript } from "@/lib/scorer";
import type { CallType } from "@/lib/types";

// Vercel: allow the detached scoring work up to 120s.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

/** Timeout deadline for the scoring call, from env (default 55s). Kept below
 *  Vercel's maxDuration so scoring fails gracefully before the function is killed. */
function llmTimeoutMs(): number {
  const raw = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 55000;
}

/** Races a promise against a deadline. Rejects with a timeout error if the
 *  promise doesn't settle in time. The underlying work is not aborted, but the
 *  rejection lets the caller record a failure instead of hanging. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Scoring timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Runs the LLM scoring and writes the outcome back to the row.
 *  Invoked via `after()` (below) so the HTTP response returns immediately and
 *  Vercel keeps the serverless function alive until scoring finishes.
 *
 *  The ENTIRE body is wrapped in one outer try/catch so no path can leave the
 *  row stuck on "processing": any failure (scoring error, timeout, or even the
 *  "completed" update) lands in the catch, which writes status "failed". The
 *  failure-write itself is guarded so a DB error is logged, never thrown. */
async function runScoring(id: string, callType: CallType, transcript: string) {
  try {
    const admin = getSupabaseAdmin();
    const result = await withTimeout(
      scoreTranscript(callType, transcript),
      llmTimeoutMs()
    );
    await admin
      .from("evaluations")
      .update({ status: "completed", result, error: null })
      .eq("id", id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[evaluate] scoring failed for ${id}:`, message);
    try {
      const admin = getSupabaseAdmin();
      await admin
        .from("evaluations")
        .update({ status: "failed", error: message })
        .eq("id", id);
    } catch (dbErr) {
      console.error(
        `[evaluate] could not write failure status for ${id}:`,
        dbErr
      );
    }
  }
}

export async function POST(req: Request) {
  let body: { call_type?: unknown; transcript?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const call_type = body.call_type;
  const transcript = body.transcript;

  if (call_type !== "kickoff" && call_type !== "coaching") {
    return Response.json(
      { error: "call_type must be 'kickoff' or 'coaching'." },
      { status: 400 }
    );
  }
  if (typeof transcript !== "string" || transcript.trim().length < 20) {
    return Response.json(
      { error: "transcript is required (paste the full call transcript)." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("evaluations")
    .insert({ call_type, transcript, status: "processing" })
    .select("id")
    .single();

  if (error || !data) {
    return Response.json(
      { error: `Could not create evaluation: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }

  // Run scoring AFTER the response is sent. `after()` tells Vercel to keep the
  // serverless function alive until this finishes — a plain detached promise gets
  // killed once the response returns, so scoring never completed.
  after(() => runScoring(data.id, call_type, transcript));

  return Response.json({ id: data.id });
}
