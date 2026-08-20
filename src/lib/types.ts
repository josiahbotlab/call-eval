export type CallType = "kickoff" | "coaching";

export type OverallBand = "ELITE" | "STRONG" | "INCONSISTENT" | "AT RISK" | "FAIL";

export type EvaluationStatus = "pending" | "processing" | "completed" | "failed";

export interface GlobalCap {
  condition: string;
  cap_description: string;
  applied: boolean;
}

export interface Dimension {
  number: number;
  name: string;
  score: number | null;
  max_score: number;
  band: string; // per-dimension band label (ELITE / STRONG / MID / WEAK / FAIL / SURFACE / N/A)
  rationale: string;
  evidence: string[];
  quick_fix: string;
  disabled: boolean;
  disabled_reason: string | null;
}

export interface EvaluationResult {
  call_type: CallType;
  total_score: number; // 0-100
  max_possible: number; // 100, or 85 when coaching D4 is disabled
  band: OverallBand;
  the_one_thing: string;
  projected_score_with_fix: number;
  brief: string;
  red_flags: string[];
  global_caps: GlobalCap[];
  dimensions: Dimension[];
}

// The shape returned by GET /api/evaluations/[id] (no transcript).
export interface EvaluationRow {
  id: string;
  call_type: CallType;
  status: EvaluationStatus;
  error: string | null;
  result: EvaluationResult | null;
  created_at: string;
  updated_at: string;
}
