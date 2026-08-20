import type { OverallBand } from "./types";

export interface BandStyle {
  label: string;
  textClass: string; // tailwind text color
  arcColor: string; // hex for the SVG gauge arc
  pdf: [number, number, number]; // rgb for jsPDF
}

const STYLES: Record<OverallBand, BandStyle> = {
  ELITE: { label: "ELITE", textClass: "text-green-600", arcColor: "#16a34a", pdf: [22, 163, 74] },
  STRONG: { label: "STRONG", textClass: "text-blue-600", arcColor: "#2563eb", pdf: [37, 99, 235] },
  INCONSISTENT: { label: "INCONSISTENT", textClass: "text-amber-500", arcColor: "#f59e0b", pdf: [245, 158, 11] },
  "AT RISK": { label: "AT RISK", textClass: "text-red-600", arcColor: "#dc2626", pdf: [220, 38, 38] },
  FAIL: { label: "FAIL", textClass: "text-red-900", arcColor: "#7f1d1d", pdf: [127, 29, 29] },
};

export function bandStyle(band: string): BandStyle {
  return STYLES[band as OverallBand] ?? STYLES.FAIL;
}

/** Derive the overall band from a 0-100 score, if the model omits/garbles it. */
export function bandForScore(score: number): OverallBand {
  if (score >= 90) return "ELITE";
  if (score >= 80) return "STRONG";
  if (score >= 70) return "INCONSISTENT";
  if (score >= 60) return "AT RISK";
  return "FAIL";
}

/** Color for a single dimension's score by percentage of its max. */
export function dimensionScoreColor(pct: number): {
  textClass: string;
  pdf: [number, number, number];
} {
  if (pct >= 0.8) return { textClass: "text-green-600", pdf: [22, 163, 74] };
  if (pct >= 0.5) return { textClass: "text-amber-500", pdf: [245, 158, 11] };
  return { textClass: "text-red-600", pdf: [220, 38, 38] };
}
