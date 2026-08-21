import { bandStyle } from "@/lib/bands";

// A score readout as it would sit on a printed evaluation form: a plain ink
// number over max, a hairline clay progress rule, and the band label.
export default function ScoreGauge({
  score,
  max,
  band,
}: {
  score: number;
  max: number;
  band: string;
}) {
  const frac = Math.max(0, Math.min(1, max > 0 ? score / max : 0));
  const bs = bandStyle(band);

  return (
    <div className="w-full min-w-[150px]">
      <div className="label">Score</div>
      <div className="mono mt-1 flex items-baseline gap-1.5">
        <span
          className="text-5xl font-semibold leading-none"
          style={{ color: "var(--ink)" }}
        >
          {score}
        </span>
        <span className="text-base" style={{ color: "var(--ink-3)" }}>
          / {max}
        </span>
      </div>

      <div
        className="mt-2 h-[2px] w-full"
        style={{ background: "var(--border-strong)" }}
      >
        <div
          className="h-full"
          style={{ width: `${(frac * 100).toFixed(1)}%`, background: "var(--accent)" }}
        />
      </div>

      <div
        className="mt-1.5 text-xs font-semibold tracking-[0.08em]"
        style={{ color: bs.color }}
      >
        {bs.label}
      </div>
    </div>
  );
}
