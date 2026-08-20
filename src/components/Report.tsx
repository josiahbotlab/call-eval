"use client";

import Link from "next/link";
import type { EvaluationResult } from "@/lib/types";
import { downloadPdf } from "@/lib/pdf";
import ScoreGauge from "./ScoreGauge";
import DimensionCard from "./DimensionCard";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Report({
  result,
  createdAt,
}: {
  result: EvaluationResult;
  createdAt: string;
}) {
  const callLabel =
    result.call_type === "kickoff" ? "KICK-OFF CALL" : "COACHING CALL";
  const appliedCaps = (result.global_caps ?? []).filter((c) => c.applied);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Full Analysis · {callLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => downloadPdf(result)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            ↓ Download PDF
          </button>
          <span className="text-xs text-gray-400">
            evaluated {timeAgo(createdAt)}
          </span>
        </div>
      </div>

      {/* Overview: one-thing/brief + gauge */}
      <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            The one thing
          </p>
          <p className="mt-2 text-2xl font-bold leading-snug text-gray-900">
            “{result.the_one_thing}”
          </p>
          {typeof result.projected_score_with_fix === "number" && (
            <p className="mt-1 text-sm text-gray-400">
              Projected {result.projected_score_with_fix} / {result.max_possible}{" "}
              with this fix
            </p>
          )}
          <p className="mt-4 leading-relaxed text-gray-600">{result.brief}</p>

          {result.red_flags?.length > 0 && (
            <div className="mt-6 space-y-2">
              {result.red_flags.map((rf, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  🚩 {rf}
                </div>
              ))}
            </div>
          )}

          {appliedCaps.length > 0 && (
            <div className="mt-3 space-y-2">
              {appliedCaps.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  Capped: {c.condition} — {c.cap_description}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:justify-self-end">
          <ScoreGauge
            score={result.total_score}
            max={result.max_possible}
            band={result.band}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="mt-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          12 dimensions
        </p>
        <div className="space-y-3">
          {result.dimensions
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((d) => (
              <DimensionCard key={d.number} d={d} />
            ))}
        </div>
      </div>
    </main>
  );
}
