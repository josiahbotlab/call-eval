"use client";

import { useState } from "react";
import type { Dimension } from "@/lib/types";
import { dimensionScoreColor } from "@/lib/bands";

export default function DimensionCard({ d }: { d: Dimension }) {
  const [open, setOpen] = useState(false);

  const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
  const scoreColor = d.disabled ? "var(--fg-3)" : dimensionScoreColor(pct).color;

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-[var(--panel)]"
      >
        {/* index */}
        <span
          className="mono w-6 flex-none text-xs"
          style={{ color: "var(--fg-3)" }}
        >
          {String(d.number).padStart(2, "0")}
        </span>

        {/* score — monospaced, left-aligned, fixed column */}
        <span
          className="mono w-16 flex-none text-sm font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {d.disabled ? "N/A" : `${d.score ?? "-"}/${d.max_score}`}
        </span>

        {/* name + collapsed rationale */}
        <span className="min-w-0 flex-1">
          <span
            className="block text-sm font-medium"
            style={{ color: "var(--fg)" }}
          >
            {d.name}
          </span>
          {!open && (
            <span
              className="mt-0.5 line-clamp-1 block text-xs"
              style={{ color: "var(--fg-3)" }}
            >
              {d.disabled
                ? d.disabled_reason || "Disabled for this call."
                : d.rationale}
            </span>
          )}
        </span>

        <span
          className="mono flex-none text-xs"
          style={{ color: "var(--fg-3)" }}
        >
          {open ? "–" : "+"}
        </span>
      </button>

      {open && (
        <div className="pb-5 pl-[88px] pr-2">
          {d.disabled && d.disabled_reason && (
            <p className="mb-3 text-sm italic" style={{ color: "var(--fg-3)" }}>
              Disabled — {d.disabled_reason}
            </p>
          )}

          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--fg-2)" }}
          >
            {d.rationale}
          </p>

          {d.evidence?.length > 0 && (
            <div className="mt-4">
              <div className="label">Evidence</div>
              <div className="mt-2 space-y-2">
                {d.evidence.map((q, i) => (
                  <p
                    key={i}
                    className="pl-3 text-sm italic leading-relaxed"
                    style={{
                      color: "var(--fg-2)",
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
            <div className="mt-4">
              <div className="label">Quick fix</div>
              <p className="mt-1 text-sm" style={{ color: "var(--fg-2)" }}>
                {d.quick_fix}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
