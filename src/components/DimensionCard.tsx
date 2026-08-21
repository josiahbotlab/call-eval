import type { Dimension } from "@/lib/types";
import { dimensionScoreColor } from "@/lib/bands";

// Always fully expanded - the report reads top to bottom, nothing hidden.
export default function DimensionCard({ d }: { d: Dimension }) {
  const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
  const scoreColor = d.disabled ? "var(--ink-3)" : dimensionScoreColor(pct).color;

  return (
    <div className="py-5" style={{ borderTop: "1px solid var(--border)" }}>
      {/* number + name left, score right, same line */}
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          <span
            className="mono mr-2 text-xs font-normal"
            style={{ color: "var(--ink-3)" }}
          >
            {String(d.number).padStart(2, "0")}
          </span>
          {d.name}
        </h3>
        <span
          className="mono flex-none text-[13px] font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {d.disabled ? "N/A" : `${d.score ?? "-"}/${d.max_score}`}
        </span>
      </div>

      {d.disabled && d.disabled_reason && (
        <p className="mt-2 text-xs italic" style={{ color: "var(--ink-3)" }}>
          Disabled - {d.disabled_reason}
        </p>
      )}

      <p
        className="mt-2 text-[13px] leading-relaxed"
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
  );
}
