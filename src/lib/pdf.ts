import { jsPDF } from "jspdf";
import type { EvaluationResult } from "./types";
import { bandStyle, dimensionScoreColor } from "./bands";

// ── Layout constants (millimetres; letter page is 215.9 x 279.4 mm) ───────────
const MARGIN = 25; // generous left/right/top/bottom margin
const SECTION_GAP = 6; // between major sections
const QUOTE_GAP = 5; // between evidence quotes
const PARA_GAP = 2.5; // after a normal paragraph
const PT_TO_MM = 25.4 / 72;

// Line height in mm for a given point size (1.45 leading for breathing room).
const lh = (sizePt: number): number => sizePt * PT_TO_MM * 1.45;

type RGB = [number, number, number];
const INK: RGB = [30, 27, 23];
const GRAY: RGB = [107, 114, 128];

/**
 * Make a string safe for jsPDF's standard (WinAnsi/cp1252) fonts. Anything
 * outside Latin-1 renders as garbled boxes ("Ø=Þ©..."), so we normalise the
 * common typographic characters to ASCII and then strip EVERYTHING above
 * U+00FF except the bullet (U+2022), which cp1252 renders correctly. This runs
 * on every single string before it reaches doc.text() — no exceptions.
 */
export function sanitize(str: unknown): string {
  return String(str ?? "")
    .replace(/[→⇒⟶⟹➔➡⮕]/g, "->") // arrows
    .replace(/[—–]/g, "-") // em/en dash -> hyphen
    .replace(/[“”]/g, '"') // curly double quotes
    .replace(/[‘’]/g, "'") // curly single quotes
    .replace(/…/g, "...") // ellipsis
    .replace(/ /g, " ") // nbsp
    // strip all remaining non-Latin-1 (emoji, symbols) except the bullet
    .replace(/[^\x00-\xFF•]/g, "")
    .replace(/[ \t]{2,}/g, " ") // collapse runs (e.g. left by stripped emoji)
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

/** Builds the evaluation PDF and returns the jsPDF doc (does not save). */
export function buildPdf(result: EvaluationResult): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const pageUsable = pageH - MARGIN * 2;
  const bottom = pageH - MARGIN;
  let y = MARGIN;

  // Add a page if `needed` mm won't fit in the remaining space.
  const ensure = (needed: number) => {
    if (y + needed > bottom) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Draw one already-wrapped line; baseline sits near the bottom of the line box.
  const writeLine = (ln: string, x: number, size: number) => {
    const h = lh(size);
    ensure(h);
    doc.text(ln, x, y + h * 0.78);
    y += h;
  };

  const text = (
    str: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: RGB;
      gap?: number;
      indent?: number;
    } = {}
  ) => {
    const size = opts.size ?? 10;
    doc.setFontSize(size);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setTextColor(...(opts.color ?? INK));
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(
      sanitize(str),
      contentW - indent
    ) as string[];
    // Page-break BEFORE the block if the whole thing fits on a fresh page but
    // not in the space that's left. Oversized blocks fall back to per-line breaks.
    const block = lines.length * lh(size);
    if (block <= pageUsable) ensure(block);
    for (const ln of lines) writeLine(ln, MARGIN + indent, size);
    if (opts.gap) y += opts.gap;
  };

  const rule = () => {
    y += 2;
    ensure(2);
    doc.setDrawColor(220, 213, 198);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += SECTION_GAP;
  };

  // A dimension header: wrapped title on the left, score right-aligned to the
  // first line. The title is wrapped to leave room for the score so they can
  // never overlap.
  const dimensionHeader = (label: string, scoreStr: string, color: RGB) => {
    const size = 10.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    const sStr = sanitize(scoreStr);
    const scoreW = doc.getTextWidth(sStr);
    const titleMaxW = Math.max(20, contentW - scoreW - 4);
    const lines = doc.splitTextToSize(sanitize(label), titleMaxW) as string[];
    const h = lh(size);
    if (lines.length * h <= pageUsable) ensure(lines.length * h);
    let first = true;
    for (const ln of lines) {
      ensure(h);
      const baseY = y + h * 0.78;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(...INK);
      doc.text(ln, MARGIN, baseY);
      if (first) {
        doc.setTextColor(...color);
        doc.text(sStr, pageW - MARGIN, baseY, { align: "right" });
        first = false;
      }
      y += h;
    }
  };

  const callLabel =
    result.call_type === "kickoff" ? "KICK-OFF CALL" : "COACHING CALL";
  const bs = bandStyle(result.band);

  // ── Header ──────────────────────────────────────────────────────────────────
  text("QC EVALUATOR - FULL ANALYSIS", { size: 9, color: GRAY, gap: 1 });
  text(callLabel, { size: 18, bold: true, gap: 1.5 });
  text(`Score: ${result.total_score} / ${result.max_possible}    Band: ${result.band}`, {
    size: 11,
    bold: true,
    color: bs.pdf as RGB,
  });
  rule();

  // ── The one thing ───────────────────────────────────────────────────────────
  text("THE ONE THING", { size: 9, bold: true, color: GRAY, gap: 2 });
  text(`"${result.the_one_thing}"`, { size: 12, bold: true, gap: 2.5 });
  if (typeof result.projected_score_with_fix === "number") {
    text(
      `Projected score with fix: ${result.projected_score_with_fix} / ${result.max_possible}`,
      { size: 9, color: GRAY, gap: 2.5 }
    );
  }
  text(result.brief, { size: 9.5, gap: PARA_GAP });

  // ── Red flags ───────────────────────────────────────────────────────────────
  if (result.red_flags?.length) {
    text("RED FLAGS", { size: 9, bold: true, color: [185, 28, 28], gap: 2 });
    for (const rf of result.red_flags) {
      text(`• ${rf}`, { size: 9.5, color: [153, 27, 27], indent: 4, gap: 2.5 });
    }
  }

  // ── Global caps that fired ──────────────────────────────────────────────────
  const applied = (result.global_caps ?? []).filter((c) => c.applied);
  if (applied.length) {
    text("CAPS APPLIED", { size: 9, bold: true, color: [180, 83, 9], gap: 2 });
    for (const c of applied) {
      text(`• ${c.condition} - ${c.cap_description}`, {
        size: 9.5,
        color: [146, 64, 14],
        indent: 4,
        gap: 2.5,
      });
    }
  }
  rule();

  // ── Dimensions ──────────────────────────────────────────────────────────────
  text("DIMENSIONS", { size: 12, bold: true, gap: 3 });
  const dims = result.dimensions.slice().sort((a, b) => a.number - b.number);
  for (const d of dims) {
    // Keep the header with at least its first couple of rationale lines.
    ensure(lh(10.5) + lh(9) * 2);

    const scoreStr = d.disabled
      ? "N/A (disabled)"
      : `${d.score ?? "-"} / ${d.max_score}`;
    const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
    const color: RGB = d.disabled ? GRAY : (dimensionScoreColor(pct).pdf as RGB);

    dimensionHeader(`${d.number}. ${d.name}`, scoreStr, color);
    y += 1.5;

    if (d.disabled && d.disabled_reason) {
      text(`Disabled: ${d.disabled_reason}`, { size: 9, color: GRAY, gap: 1.5 });
    }
    text(d.rationale, { size: 9, gap: PARA_GAP });

    if (d.evidence?.length) {
      text("EVIDENCE", { size: 8, bold: true, color: GRAY, gap: 2 });
      for (const q of d.evidence) {
        text(`"${q}"`, { size: 8, color: [55, 65, 81], indent: 6, gap: QUOTE_GAP });
      }
    }

    if (d.quick_fix) {
      text("QUICK FIX", { size: 8, bold: true, color: GRAY, gap: 1.5 });
      text(d.quick_fix, { size: 8.5, color: [55, 65, 81], indent: 4 });
    }

    rule();
  }

  return doc;
}

export function downloadPdf(result: EvaluationResult) {
  const doc = buildPdf(result);
  doc.save(`evaluation-${result.call_type}-${result.total_score}.pdf`);
}
