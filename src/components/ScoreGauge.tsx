import { bandStyle } from "@/lib/bands";

// Semicircle gauge. Track goes left(0) -> right(max) over the top; the colored
// fill is a dash of the same path, so no arc-flag math for the fill.
const TRACK = "M 20 110 A 90 90 0 0 1 200 110";

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
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 120" className="w-56">
        <path
          d={TRACK}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={TRACK}
          fill="none"
          stroke={bs.arcColor}
          strokeWidth={14}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${(frac * 100).toFixed(2)} 100`}
        />
        <text
          x="110"
          y="96"
          textAnchor="middle"
          className="fill-gray-900"
          fontSize="36"
          fontWeight={700}
        >
          {score}
        </text>
        <text
          x="110"
          y="114"
          textAnchor="middle"
          className="fill-gray-400"
          fontSize="13"
        >
          / {max}
        </text>
      </svg>
      <div className={`mt-1 text-sm font-bold tracking-wide ${bs.textClass}`}>
        {bs.label}
      </div>
    </div>
  );
}
