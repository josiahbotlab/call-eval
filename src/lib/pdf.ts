import { jsPDF } from "jspdf";
import type { EvaluationResult } from "./types";
import { bandStyle, dimensionScoreColor } from "./bands";

const MARGIN = 48;
const LINE = 15;

// jsPDF's standard (WinAnsi) fonts can't render emoji or arrow glyphs — they come
// out as garbled boxes. Convert rightward arrows to "->" and strip emoji before any
// text is written. Latin-1/cp1252 punctuation (• — – “ ”) renders fine and is kept.
function sanitize(str: string): string {
  return str
    .replace(/[→⇒⟶⟹➔➡⮕]/g, "->")
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}\u{20E3}]/gu,
      ""
    );
}

export function downloadPdf(result: EvaluationResult) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const text = (
    str: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      gap?: number;
      indent?: number;
    } = {}
  ) => {
    const size = opts.size ?? 10;
    doc.setFontSize(size);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setTextColor(...(opts.color ?? [17, 24, 39]));
    const indent = opts.indent ?? 0;
    const lines = doc.splitTextToSize(sanitize(str), contentW - indent) as string[];
    const lh = size + 4;
    for (const ln of lines) {
      ensure(lh);
      doc.text(ln, MARGIN + indent, y);
      y += lh;
    }
    if (opts.gap) y += opts.gap;
  };

  const rule = () => {
    ensure(12);
    doc.setDrawColor(229, 231, 235);
    doc.line(MARGIN, y, pageW - MARGIN, y);
    y += 12;
  };

  const callLabel =
    result.call_type === "kickoff" ? "KICK-OFF CALL" : "COACHING CALL";
  const bs = bandStyle(result.band);

  // Header
  text("QC EVALUATOR — FULL ANALYSIS", { size: 9, color: [107, 114, 128] });
  text(callLabel, { size: 20, bold: true, gap: 6 });
  text(
    `Score: ${result.total_score} / ${result.max_possible}    Band: ${result.band}`,
    { size: 12, bold: true, color: bs.pdf, gap: 10 }
  );
  rule();

  // The one thing
  text("THE ONE THING", { size: 9, bold: true, color: [107, 114, 128] });
  text(`“${result.the_one_thing}”`, { size: 13, bold: true, gap: 4 });
  if (typeof result.projected_score_with_fix === "number") {
    text(`Projected score with fix: ${result.projected_score_with_fix} / ${result.max_possible}`, {
      size: 9,
      color: [107, 114, 128],
      gap: 8,
    });
  }
  text(result.brief, { size: 10, gap: 10 });

  // Red flags
  if (result.red_flags?.length) {
    text("RED FLAGS", { size: 9, bold: true, color: [185, 28, 28] });
    for (const rf of result.red_flags) {
      text(`• ${rf}`, { size: 10, color: [153, 27, 27], indent: 4 });
    }
    y += 6;
  }

  // Global caps that fired
  const applied = (result.global_caps ?? []).filter((c) => c.applied);
  if (applied.length) {
    text("CAPS APPLIED", { size: 9, bold: true, color: [180, 83, 9] });
    for (const c of applied) {
      text(`Capped: ${c.condition} — ${c.cap_description}`, {
        size: 10,
        color: [146, 64, 14],
        indent: 4,
      });
    }
    y += 6;
  }
  rule();

  // Dimensions
  text("DIMENSIONS", { size: 12, bold: true, gap: 8 });
  for (const d of result.dimensions) {
    ensure(40);
    const scoreStr = d.disabled
      ? "N/A (disabled)"
      : `${d.score ?? "-"} / ${d.max_score}`;
    const pct = d.disabled || !d.max_score ? 0 : (d.score ?? 0) / d.max_score;
    const color = d.disabled ? [107, 114, 128] : dimensionScoreColor(pct).pdf;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    ensure(16);
    doc.text(sanitize(`${d.number}. ${d.name}`), MARGIN, y);
    doc.setTextColor(...(color as [number, number, number]));
    doc.text(scoreStr, pageW - MARGIN, y, { align: "right" });
    y += 16;

    if (d.disabled && d.disabled_reason) {
      text(`Disabled: ${d.disabled_reason}`, { size: 9, color: [107, 114, 128] });
    }
    text(d.rationale, { size: 10, gap: 4 });

    if (d.evidence?.length) {
      text("EVIDENCE", { size: 8, bold: true, color: [107, 114, 128] });
      for (const q of d.evidence) {
        text(`“${q}”`, { size: 9, color: [55, 65, 81], indent: 10 });
      }
    }
    if (d.quick_fix) {
      text("QUICK FIX", { size: 8, bold: true, color: [107, 114, 128] });
      text(d.quick_fix, { size: 9, color: [55, 65, 81], indent: 4 });
    }
    y += 10;
    rule();
  }

  doc.save(`evaluation-${result.call_type}-${result.total_score}.pdf`);
}
