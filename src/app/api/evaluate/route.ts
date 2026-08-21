import { after } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { scoreTranscript } from "@/lib/scorer";
import type { CallType } from "@/lib/types";

// Vercel: allow the detached scoring work up to 120s.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

/** Runs the LLM scoring and writes the outcome back to the row.
 *  Invoked via `after()` (below) so the HTTP response returns immediately and
 *  Vercel keeps the serverless function alive until scoring finishes. */
async function runScoring(id: string, callType: CallType, transcript: string) {
  const admin = getSupabaseAdmin();
  try {
    const result = await scoreTranscript(callType, transcript);
    await admin
      .from("evaluations")
      .update({ status: "completed", result, error: null })
      .eq("id", id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await admin
      .from("evaluations")
      .update({ status: "failed", error: message })
      .eq("id", id);
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
