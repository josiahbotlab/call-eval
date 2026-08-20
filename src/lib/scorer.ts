import OpenAI from "openai";
import { kickoffRubric } from "./kickoff-rubric";
import { coachingRubric } from "./coaching-rubric";
import { bandForScore } from "./bands";
import type { CallType, EvaluationResult } from "./types";

// Lazy-init: do not instantiate at module scope or the build breaks without env.
let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });
  }
  return client;
}

function model(): string {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-6";
}

const SYSTEM_PROMPT = `You are a call quality evaluator for a coaching company. You grade coaching calls against a fixed rubric with surgical precision.

Rules:
- Evidence-based only. Every score and rationale must be grounded in the transcript — specific moments, behaviours, and verbatim quotes.
- Never guess, never infer from general impression, never invent quotes. If a behaviour is not verifiable in the transcript, say so and score conservatively within the correct band.
- Apply the rubric's band definitions and its Global Automatic Score Caps exactly as written.
- Output ONLY a single JSON object that matches the requested schema. No prose, no markdown, no code fences.`;

function schemaBlock(callType: CallType): string {
  const maxNote =
    callType === "coaching"
      ? `100, unless coaching Dimension 4 (Movement Coaching Quality) is disabled — then 85`
      : `100`;
  return `Return a JSON object with EXACTLY these keys:

{
  "call_type": "${callType}",
  "total_score": <integer 0-100, the final score AFTER any global caps are applied>,
  "max_possible": <${maxNote}>,
  "band": <one of "ELITE" (90-100), "STRONG" (80-89), "INCONSISTENT" (70-79), "AT RISK" (60-69), "FAIL" (<60)>,
  "the_one_thing": <string: the single highest-leverage change this coach should make>,
  "projected_score_with_fix": <integer 0-100: estimated total score if "the_one_thing" were fixed>,
  "brief": <string: 2-4 sentences addressed directly to the coach, second person>,
  "red_flags": [<string, ...>] (may be empty),
  "global_caps": [
    { "condition": <string, the cap condition from the rubric>, "cap_description": <string, what the cap does>, "applied": <boolean> }
  ],
  "dimensions": [
    {
      "number": <1-12>,
      "name": <string, the dimension name>,
      "score": <number or null when disabled>,
      "max_score": <number, the dimension's max points>,
      "band": <string, the dimension-level band label, e.g. "ELITE" | "STRONG" | "MID" | "SURFACE" | "WEAK" | "FAIL" | "N/A">,
      "rationale": <string, begins with a reference to a specific moment in the transcript>,
      "evidence": [<string, ...>]  (VERBATIM transcript quotes; if the behaviour was not observed, include a single string saying so, e.g. "Not observed in transcript."),
      "quick_fix": <string, one concrete change the coach can make>,
      "disabled": <boolean>,
      "disabled_reason": <string or null>
    }
    // ... EXACTLY 12 dimension objects, numbered 1 through 12, in order
  ]
}

Requirements:
- The "dimensions" array MUST contain exactly 12 objects (numbers 1-12).
- "evidence" entries must be verbatim quotes from the transcript. Do not paraphrase inside evidence. If a behaviour was not observed, state that plainly instead of fabricating a quote.
- List every Global Automatic Score Cap from the rubric in "global_caps" with "applied" set correctly, and reflect any applied cap in "total_score".
- For coaching calls only: if Dimension 4 is disabled per its detection criteria, set that dimension's "disabled": true, "score": null, "band": "N/A", and set "max_possible": 85. Otherwise "max_possible": 100.`;
}

function buildUserPrompt(
  callType: CallType,
  rubric: string,
  transcript: string
): string {
  const label = callType === "kickoff" ? "KICK-OFF" : "COACHING";
  return `You are grading a ${label} call.

===== RUBRIC =====
${rubric}
===== END RUBRIC =====

===== TRANSCRIPT =====
${transcript}
===== END TRANSCRIPT =====

${schemaBlock(callType)}`;
}

function stripFences(raw: string): string {
  let s = raw.trim();
  // Strip markdown fences in all variations (```json with varying whitespace).
  s = s.replace(/^```[\s\S]*?\n/, "").replace(/\n?```\s*$/, "");
  s = s.trim();
  // if there is surrounding prose, grab the outermost JSON object
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > 0 || last < s.length - 1) {
    if (first !== -1 && last !== -1 && last > first) {
      s = s.slice(first, last + 1);
    }
  }
  return s.trim();
}

function validate(result: EvaluationResult): EvaluationResult {
  if (!result || typeof result !== "object") {
    throw new Error("Model did not return a JSON object.");
  }
  if (!Array.isArray(result.dimensions) || result.dimensions.length !== 12) {
    throw new Error(
      `Expected 12 dimensions, got ${
        Array.isArray(result.dimensions) ? result.dimensions.length : "none"
      }.`
    );
  }
  if (typeof result.total_score !== "number") {
    throw new Error("Missing numeric total_score.");
  }
  // Backfill / normalize a few fields defensively.
  if (!result.max_possible) result.max_possible = 100;
  if (!result.band) result.band = bandForScore(result.total_score);
  if (!Array.isArray(result.red_flags)) result.red_flags = [];
  if (!Array.isArray(result.global_caps)) result.global_caps = [];
  for (const d of result.dimensions) {
    if (!Array.isArray(d.evidence)) d.evidence = [];
    if (typeof d.disabled !== "boolean") d.disabled = false;
    if (d.disabled_reason === undefined) d.disabled_reason = null;
  }
  return result;
}

export async function scoreTranscript(
  callType: CallType,
  transcript: string
): Promise<EvaluationResult> {
  const rubric = callType === "kickoff" ? kickoffRubric : coachingRubric;
  const userPrompt = buildUserPrompt(callType, rubric, transcript);

  const completion = await getClient().chat.completions.create({
    model: model(),
    temperature: 0.2,
    max_tokens: 8000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content ?? "";
  if (!raw.trim()) {
    throw new Error("Model returned an empty response.");
  }

  let parsed: EvaluationResult;
  try {
    parsed = JSON.parse(stripFences(raw)) as EvaluationResult;
  } catch {
    throw new Error(
      `Could not parse model output as JSON. First 300 chars: ${raw
        .slice(0, 300)
        .replace(/\s+/g, " ")}`
    );
  }

  parsed.call_type = callType;
  return validate(parsed);
}
