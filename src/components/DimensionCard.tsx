"use client";

import { useState } from "react";
import type { Dimension } from "@/lib/types";
import { dimensionScoreColor } from "@/lib/bands";

export default function DimensionCard({ d }: { d: Dimension }) {
  const [open, setOpen] = useState(false);

  const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
  const scoreColor = d.disabled ? "var(--ink-3)" : dimensionScoreColor(pct).color;

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 py-2 text-left hover:bg-[var(--field)]"
      >
        {/* number */}
        <span
          className="mono w-6 flex-none text-xs"
          style={{ color: "var(--ink-3)" }}
        >
          {String(d.number).padStart(2, "0")}
        </span>

        {/* name + collapsed rationale */}
        <span className="min-w-0 flex-1">
          <span
            className="block text-[13px] font-medium leading-tight"
            style={{ color: "var(--ink)" }}
          >
            {d.name}
          </span>
          {!open && (
            <span
              className="mt-0.5 line-clamp-1 block text-xs"
              style={{ color: "var(--ink-3)" }}
            >
              {d.disabled
                ? d.disabled_reason || "Disabled for this call."
                : d.rationale}
            </span>
          )}
        </span>

        {/* score, right-aligned monospace */}
        <span
          className="mono flex-none text-right text-[13px] font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {d.disabled ? "N/A" : `${d.score ?? "-"}/${d.max_score}`}
        </span>

        <span
          className="mono w-3 flex-none text-right text-xs"
          style={{ color: "var(--ink-3)" }}
        >
          {open ? "-" : "+"}
        </span>
      </button>

      {open && (
        <div className="pb-4 pl-9 pr-2">
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
            <div className="mt-3">
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
