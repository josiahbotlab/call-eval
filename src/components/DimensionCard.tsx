"use client";

import { useState } from "react";
import type { Dimension } from "@/lib/types";
import { dimensionScoreColor } from "@/lib/bands";

export default function DimensionCard({ d }: { d: Dimension }) {
  const [open, setOpen] = useState(false);

  const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
  const scoreColor = d.disabled ? "text-gray-400" : dimensionScoreColor(pct).textClass;
  const belowHalf = !d.disabled && pct < 0.5;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-600">
          {d.number}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{d.name}</span>
            {belowHalf && (
              <span className="text-amber-500" title="Scoring below 50%">
                ★
              </span>
            )}
          </div>
          {!open && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {d.disabled
                ? d.disabled_reason || "Disabled for this call."
                : d.rationale}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center gap-3">
          <span className={`text-sm font-semibold ${scoreColor}`}>
            {d.disabled ? "N/A" : `${d.score ?? "-"} / ${d.max_score}`}
          </span>
          <span className="text-gray-300">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 pl-[60px]">
          {d.disabled && d.disabled_reason && (
            <p className="mb-3 text-sm italic text-gray-500">
              Disabled — {d.disabled_reason}
            </p>
          )}

          <p className="text-sm leading-relaxed text-gray-700">{d.rationale}</p>

          {d.evidence?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Evidence
              </p>
              <div className="mt-2 space-y-2">
                {d.evidence.map((q, i) => (
                  <p
                    key={i}
                    className="border-l-2 border-gray-200 pl-3 text-sm italic text-gray-600"
                  >
                    {q}
                  </p>
                ))}
              </div>
            </div>
          )}

          {d.quick_fix && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quick fix
              </p>
              <p className="mt-1 text-sm text-gray-700">{d.quick_fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
