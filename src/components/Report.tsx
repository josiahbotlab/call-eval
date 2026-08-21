"use client";

import Link from "next/link";
import type { EvaluationResult } from "@/lib/types";
import { downloadPdf } from "@/lib/pdf";
import { bandStyle, dimensionScoreColor } from "@/lib/bands";
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
  const callTag = result.call_type === "kickoff" ? "KICK-OFF" : "COACHING";
  const bs = bandStyle(result.band);
  const appliedCaps = (result.global_caps ?? []).filter((c) => c.applied);
  const dims = result.dimensions.slice().sort((a, b) => a.number - b.number);

  // Inline flags + caps as one middle-dot-separated run.
  const noteItems = [
    ...(result.red_flags ?? []),
    ...appliedCaps.map((c) => `Cap: ${c.condition}`),
  ];

  return (
    <>
      {/* Sticky score strip */}
      <div
        className="sticky top-0 z-20"
        style={{
          background: "var(--paper)",
          borderBottom: "1px solid var(--border-strong)",
        }}
      >
        <div className="mx-auto flex h-10 max-w-3xl items-center gap-3 px-6">
          <Link
            href="/"
            className="text-[11px] font-semibold hover:text-[var(--ink)]"
            style={{ color: "var(--ink-3)" }}
          >
            QC Evaluator
          </Link>
          <span
            className="label"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1px 5px",
            }}
          >
            {callTag}
          </span>
          <span
            className="mono text-[13px] font-semibold tabular-nums"
            style={{ color: "var(--ink)" }}
          >
            {result.total_score} / {result.max_possible}
          </span>
          <span
            className="text-[11px] font-semibold tracking-[0.06em]"
            style={{ color: bs.color }}
          >
            {bs.label}
          </span>

          <span
            className="ml-auto text-[11px]"
            style={{ color: "var(--ink-3)" }}
          >
            evaluated {timeAgo(createdAt)}
          </span>
          <button
            onClick={() => downloadPdf(result)}
            className="text-[11px] font-medium hover:text-[var(--ink)]"
            style={{ color: "var(--accent)" }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Continuous document */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* The one thing */}
        <p className="label">The one thing</p>
        <p
          className="mt-1.5 pl-3 text-[15px] font-medium leading-snug"
          style={{
            color: "var(--ink)",
            borderLeft: "2px solid var(--accent)",
          }}
        >
          {result.the_one_thing}
        </p>
        {typeof result.projected_score_with_fix === "number" && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--ink-3)" }}>
            Projected {result.projected_score_with_fix} / {result.max_possible}{" "}
            with this fix
          </p>
        )}

        {/* Brief */}
        <p
          className="mt-4 text-[13px] leading-relaxed"
          style={{ color: "var(--ink-2)" }}
        >
          {result.brief}
        </p>

        {/* Flags + caps, inline */}
        {noteItems.length > 0 && (
          <p
            className="mt-4 text-[13px] leading-relaxed"
            style={{ color: "var(--accent)" }}
          >
            {noteItems.join("  ·  ")}
          </p>
        )}

        <div
          className="mt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        />

        {/* Dimension scores overview */}
        <p className="label mt-6">Dimension scores</p>
        <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1.5 sm:grid-cols-4">
          {dims.map((d) => {
            const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
            const color = d.disabled
              ? "var(--ink-3)"
              : dimensionScoreColor(pct).color;
            return (
              <div
                key={d.number}
                className="mono flex items-baseline justify-between text-xs tabular-nums"
              >
                <span style={{ color: "var(--ink-3)" }}>D{d.number}</span>
                <span style={{ color }}>
                  {d.disabled ? "N/A" : `${d.score ?? "-"}/${d.max_score}`}
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="mt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        />

        {/* All 12 dimensions, fully expanded */}
        <div
          className="mt-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {dims.map((d) => (
            <DimensionCard key={d.number} d={d} />
          ))}
        </div>
      </main>
    </>
  );
}
