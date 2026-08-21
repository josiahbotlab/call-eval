import type { OverallBand } from "./types";

export interface BandStyle {
  label: string;
  color: string; // hex for dark-mode UI (score number, underline, band label)
  pdf: [number, number, number]; // rgb for jsPDF (light-background report)
}

// UI colors are muted, dark-mode-tuned; PDF colors stay saturated for print.
const STYLES: Record<OverallBand, BandStyle> = {
  ELITE: { label: "ELITE", color: "#79b083", pdf: [22, 163, 74] },
  STRONG: { label: "STRONG", color: "#94ac7a", pdf: [37, 99, 235] },
  INCONSISTENT: { label: "INCONSISTENT", color: "#c99a5b", pdf: [245, 158, 11] },
  "AT RISK": { label: "AT RISK", color: "#cf9159", pdf: [220, 38, 38] },
  FAIL: { label: "FAIL", color: "#cf6f5c", pdf: [127, 29, 29] },
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
  if (pct >= 0.8) return { color: "#79b083", pdf: [22, 163, 74] };
  if (pct >= 0.5) return { color: "#c99a5b", pdf: [245, 158, 11] };
  return { color: "#cf6f5c", pdf: [220, 38, 38] };
}
