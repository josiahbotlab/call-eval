"use client";

import { useState } from "react";
import type { Dimension } from "@/lib/types";
import { dimensionScoreColor } from "@/lib/bands";

// Collapsed by default: number, name, score, and a 2-line rationale preview.
// Click to expand the full rationale, evidence, and quick fix.
export default function DimensionCard({ d }: { d: Dimension }) {
  const [open, setOpen] = useState(false);

  const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
  const scoreColor = d.disabled ? "var(--ink-3)" : dimensionScoreColor(pct).color;

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full py-5 text-left hover:bg-[var(--field-hover)]"
      >
        {/* number + name left, score + toggle right, same line */}
        <div className="flex items-baseline justify-between gap-4">
          <h3
            className="text-[13px] font-semibold"
            style={{ color: "var(--ink)" }}
          >
            <span
              className="mono mr-2 text-xs font-normal"
              style={{ color: "var(--ink-3)" }}
            >
              {String(d.number).padStart(2, "0")}
            </span>
            {d.name}
          </h3>
          <div className="flex flex-none items-baseline gap-3">
            <span
              className="mono text-[13px] font-semibold tabular-nums"
              style={{ color: scoreColor }}
            >
              {d.disabled ? "N/A" : `${d.score ?? "-"}/${d.max_score}`}
            </span>
            <span
              className="mono w-3 text-center text-sm"
              style={{ color: "var(--ink-3)" }}
              aria-hidden
            >
              {open ? "-" : "+"}
            </span>
          </div>
        </div>

        {/* collapsed preview: first 2 lines of rationale */}
        {!open && (
          <p
            className="mt-2 line-clamp-2 pr-6 text-[13px] leading-relaxed"
            style={{ color: "var(--ink-3)" }}
          >
            {d.disabled
              ? d.disabled_reason || "Disabled for this call."
              : d.rationale}
          </p>
        )}
      </button>

      {open && (
        <div className="pb-5">
          {d.disabled && d.disabled_reason && (
            <p className="mb-2 text-xs italic" style={{ color: "var(--ink-3)" }}>
              Disabled - {d.disabled_reason}
            </p>
          )}

          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "var(--ink-2)" }}
          >
            {d.rationale}
          </p>

          {d.evidence?.length > 0 && (
            <div className="mt-3">
              <div className="label">Evidence</div>
              <div className="mt-1.5 space-y-1.5">
                {d.evidence.map((q, i) => (
                  <p
                    key={i}
                    className="pl-2.5 text-xs italic leading-relaxed"
                    style={{
                      color: "var(--ink-2)",
                      borderLeft: "1px solid var(--border-strong)",
                    }}
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}

          {d.quick_fix && (
            <div
              className="mt-3 p-2.5"
              style={{
                background: "var(--field)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              <div className="label">Quick fix</div>
              <p className="mt-1 text-[13px]" style={{ color: "var(--ink-2)" }}>
                {d.quick_fix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
