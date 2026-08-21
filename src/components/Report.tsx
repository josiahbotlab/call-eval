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
    <main className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mono text-xs transition-colors hover:text-[var(--fg)]"
            style={{ color: "var(--fg-3)" }}
          >
            ← Back
          </Link>
          <p className="label mt-3">Full Analysis · {callLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => downloadPdf(result)}
            className="px-3 py-1.5 text-xs font-medium transition-colors hover:text-[var(--fg)] hover:border-[var(--border-strong)]"
            style={{
              color: "var(--fg-2)",
              border: "1px solid var(--border)",
            }}
          >
            Download PDF
          </button>
          <span className="mono text-[11px]" style={{ color: "var(--fg-3)" }}>
            evaluated {timeAgo(createdAt)}
          </span>
        </div>
      </div>

      {/* Overview: one-thing / brief + score */}
      <div className="mt-10 grid grid-cols-1 items-start gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="label">The one thing</p>
          <p
            className="mt-2 text-2xl font-semibold leading-snug"
            style={{ color: "var(--fg)" }}
          >
            {result.the_one_thing}
          </p>
          {typeof result.projected_score_with_fix === "number" && (
            <p className="mono mt-2 text-xs" style={{ color: "var(--fg-3)" }}>
              Projected {result.projected_score_with_fix} / {result.max_possible}{" "}
              with this fix
            </p>
          )}
          <p
            className="mt-5 leading-relaxed"
            style={{ color: "var(--fg-2)" }}
          >
            {result.brief}
          </p>

          {result.red_flags?.length > 0 && (
            <div className="mt-7">
              <p className="label" style={{ color: "var(--band-fail)" }}>
                Red flags
              </p>
              <div className="mt-3 space-y-2.5">
                {result.red_flags.map((rf, i) => (
                  <p
                    key={i}
                    className="pl-3 text-sm leading-relaxed"
                    style={{
                      color: "var(--fg-2)",
                      borderLeft: "1px solid var(--band-fail)",
                    }}
                  >
                    {rf}
                  </p>
                ))}
              </div>
            </div>
          )}

          {appliedCaps.length > 0 && (
            <div className="mt-6">
              <p className="label" style={{ color: "var(--accent)" }}>
                Caps applied
              </p>
              <div className="mt-3 space-y-2.5">
                {appliedCaps.map((c, i) => (
                  <p
                    key={i}
                    className="pl-3 text-sm leading-relaxed"
                    style={{
                      color: "var(--fg-2)",
                      borderLeft: "1px solid var(--accent-dim)",
                    }}
                  >
                    {c.condition} — {c.cap_description}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:justify-self-end md:pt-1">
          <ScoreGauge
            score={result.total_score}
            max={result.max_possible}
            band={result.band}
          />
        </div>
      </div>

      {/* Dimensions */}
      <div className="mt-12">
        <p className="label mb-1">12 dimensions</p>
        <div style={{ borderBottom: "1px solid var(--border)" }}>
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
