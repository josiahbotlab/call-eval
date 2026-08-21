import type { OverallBand } from "./types";

export interface BandStyle {
  label: string;
  color: string; // hex for UI: ink when fine, clay accent when it needs attention
  pdf: [number, number, number]; // rgb for jsPDF (light-background report)
}

// UI stays monochrome + one accent: good bands read in ink, weaker bands are
// flagged in clay. PDF colors are left saturated for the printed report.
const STYLES: Record<OverallBand, BandStyle> = {
  ELITE: { label: "ELITE", color: "#2b2723", pdf: [22, 163, 74] },
  STRONG: { label: "STRONG", color: "#2b2723", pdf: [37, 99, 235] },
  INCONSISTENT: { label: "INCONSISTENT", color: "#b5705a", pdf: [245, 158, 11] },
  "AT RISK": { label: "AT RISK", color: "#b5705a", pdf: [220, 38, 38] },
  FAIL: { label: "FAIL", color: "#b5705a", pdf: [127, 29, 29] },
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
  color: string;
  pdf: [number, number, number];
} {
  // UI: only genuinely weak scores (< 50%) get the clay accent; the rest read
  // in plain ink. PDF keeps a green/amber/red tier for print.
  if (pct >= 0.8) return { color: "#2b2723", pdf: [22, 163, 74] };
  if (pct >= 0.5) return { color: "#2b2723", pdf: [245, 158, 11] };
  return { color: "#b5705a", pdf: [220, 38, 38] };
}
