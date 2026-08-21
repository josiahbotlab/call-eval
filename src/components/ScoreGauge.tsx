import { bandStyle } from "@/lib/bands";

// A large monospaced number over a thin horizontal progress bar in the band
// color — no semicircle, no dial. Reads like a terminal readout.
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
    <div className="w-full min-w-[180px]">
      <div className="label">Score</div>
      <div className="mono mt-2 flex items-baseline gap-1.5">
        <span
          className="text-6xl font-semibold leading-none"
          style={{ color: bs.color }}
        >
          {score}
        </span>
        <span className="text-lg" style={{ color: "var(--fg-3)" }}>
          / {max}
        </span>
      </div>

      {/* thin progress bar */}
      <div
        className="mt-3 h-[3px] w-full"
        style={{ background: "var(--border-strong)" }}
      >
        <div
          className="h-full"
          style={{ width: `${(frac * 100).toFixed(1)}%`, background: bs.color }}
        />
      </div>

      <div
        className="mono mt-2 text-xs font-semibold tracking-[0.12em]"
        style={{ color: bs.color }}
      >
        {bs.label}
      </div>
    </div>
  );
}
