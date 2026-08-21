/**
 * model-compare.ts — score one transcript through several OpenRouter models in
 * parallel and print the results side by side.
 *
 * Uses the exact scorer pipeline from src/lib/scorer.ts (same system prompt,
 * rubric, schema, fence-stripping and validation) via scoreTranscript()'s
 * optional model override. Reads OPENROUTER_API_KEY from .env.local.
 *
 *   npx tsx scripts/model-compare.ts
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreTranscript } from "../src/lib/scorer";
import type { EvaluationResult } from "../src/lib/types";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ── Load .env.local (tsx does not do this automatically) ──────────────────────
function loadEnv(file: string) {
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadEnv(join(ROOT, ".env.local"));

const MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-3.7-flash",
  "deepseek/deepseek-v4-flash",
  "openai/gpt-5.1",
  "anthropic/claude-sonnet-4.6",
];

const shortName = (m: string): string => m.split("/").pop() ?? m;

type Outcome =
  | { model: string; ok: true; secs: number; result: EvaluationResult }
  | { model: string; ok: false; secs: number; error: string };

async function run(model: string, transcript: string): Promise<Outcome> {
  const started = Date.now();
  try {
    const result = await scoreTranscript("kickoff", transcript, model);
    return { model, ok: true, secs: (Date.now() - started) / 1000, result };
  } catch (e) {
    return {
      model,
      ok: false,
      secs: (Date.now() - started) / 1000,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY (looked in .env.local).");
    process.exit(1);
  }

  const transcriptPath = join(
    ROOT,
    "transcripts-repo/transcripts/kickoff-02.txt"
  );
  const transcript = readFileSync(transcriptPath, "utf8");

  console.log(
    `\nScoring transcripts-repo/transcripts/kickoff-02.txt (${transcript.length.toLocaleString()} chars) as a KICK-OFF call`
  );
  console.log(`Models: ${MODELS.map(shortName).join(", ")}`);
  console.log("Running in parallel…\n");

  const outcomes = await Promise.all(MODELS.map((m) => run(m, transcript)));

  // ── Side-by-side table ──────────────────────────────────────────────────────
  const COL = 18; // width of each model column
  const LABELW = 34; // width of the leftmost row-label column
  const pad = (s: string, w: number) => s.padEnd(w).slice(0, w);
  const padR = (s: string, w: number) => s.padStart(w);
  const cell = (o: Outcome, get: (r: EvaluationResult) => string): string =>
    padR(o.ok ? get(o.result) : "ERR", COL);

  const sep = "─".repeat(LABELW + COL * outcomes.length);

  let header = pad("", LABELW);
  for (const o of outcomes) header += padR(shortName(o.model), COL);

  console.log(sep);
  console.log(header);
  console.log(sep);

  let scoreRow = pad("TOTAL SCORE", LABELW);
  for (const o of outcomes)
    scoreRow += cell(o, (r) => `${r.total_score} / ${r.max_possible}`);
  console.log(scoreRow);

  let bandRow = pad("BAND", LABELW);
  for (const o of outcomes) bandRow += cell(o, (r) => r.band);
  console.log(bandRow);

  let timeRow = pad("TIME (s)", LABELW);
  for (const o of outcomes) timeRow += padR(o.secs.toFixed(1), COL);
  console.log(timeRow);

  console.log(sep);

  // Dimension rows (keyed by number 1-12). Use the first ok result for names.
  const first = outcomes.find((o) => o.ok) as
    | Extract<Outcome, { ok: true }>
    | undefined;

  if (first) {
    const names = new Map<number, string>();
    for (const d of first.result.dimensions) names.set(d.number, d.name);

    for (let n = 1; n <= 12; n++) {
      const name = names.get(n) ?? `Dimension ${n}`;
      let row = pad(`${String(n).padStart(2, "0")} ${name}`, LABELW);
      for (const o of outcomes) {
        row += cell(o, (r) => {
          const d = r.dimensions.find((x) => x.number === n);
          if (!d) return "-";
          if (d.disabled) return "N/A";
          return `${d.score ?? "-"} / ${d.max_score}`;
        });
      }
      console.log(row);
    }
    console.log(sep);
  }

  const failed = outcomes.filter((o) => !o.ok) as Extract<
    Outcome,
    { ok: false }
  >[];
  if (failed.length) {
    console.log("\nErrors:");
    for (const f of failed) console.log(`  ${shortName(f.model)}: ${f.error}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
