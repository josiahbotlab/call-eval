"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CallType } from "@/lib/types";
import { bandStyle } from "@/lib/bands";

interface RecentEval {
  id: string;
  call_type: string;
  total_score: number | null;
  band: string | null;
  max_possible: number;
  created_at: string;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const router = useRouter();
  const [callType, setCallType] = useState<CallType | null>(null);
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentEval[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/evaluations/recent")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (active && Array.isArray(d)) setRecent(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const canSubmit =
    callType !== null && transcript.trim().length >= 20 && !submitting;

  async function onSubmit() {
    if (!canSubmit || !callType) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call_type: callType, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start evaluation.");
      router.push(`/run/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6">
      <h1
        className="text-sm font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        QC Evaluator
      </h1>

      {/* Primary element: the transcript, filling the page like a code editor */}
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste the full call transcript here..."
        spellCheck={false}
        className="mono mt-3 min-h-[45vh] w-full flex-1 resize-none p-4 text-xs leading-relaxed outline-none focus:border-[var(--border-strong)]"
        style={{
          background: "var(--field)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          color: "var(--ink)",
        }}
      />

      {error && (
        <p
          className="mt-3 pl-2.5 text-[13px] leading-relaxed"
          style={{
            color: "var(--ink-2)",
            borderLeft: "1px solid var(--accent)",
          }}
        >
          {error}
        </p>
      )}

      {/* Secondary controls, all on one line */}
      <div className="mt-3 flex items-center gap-4">
        <Segmented callType={callType} onSelect={setCallType} />

        <span className="mono text-[11px]" style={{ color: "var(--ink-3)" }}>
          {transcript.length.toLocaleString()} chars
        </span>

        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="btn-primary ml-auto px-8 py-3.5 text-[17px] font-semibold"
        >
          {submitting ? "Starting..." : "Run evaluation"}
        </button>
      </div>

      {recent.length > 0 && (
        <section
          className="mt-8"
          style={{ borderTop: "1px solid var(--border-strong)" }}
        >
          <p className="label mt-5">Recent evaluations</p>
          <div className="mt-2">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/run/${r.id}`}
                className="flex items-center gap-4 px-1 py-2.5 hover:bg-[var(--field-hover)]"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="w-20 flex-none text-[11px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: "var(--ink-2)" }}
                >
                  {r.call_type === "kickoff" ? "KICK-OFF" : "COACHING"}
                </span>
                <span
                  className="mono w-16 flex-none text-[13px] font-semibold tabular-nums"
                  style={{ color: "var(--ink)" }}
                >
                  {r.total_score ?? "-"} / {r.max_possible}
                </span>
                <span
                  className="text-[12px] font-semibold tracking-[0.04em]"
                  style={{ color: r.band ? bandStyle(r.band).color : "var(--ink-3)" }}
                >
                  {r.band ?? ""}
                </span>
                <span
                  className="ml-auto text-[11px]"
                  style={{ color: "var(--ink-3)" }}
                >
                  {timeAgo(r.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Segmented({
  callType,
  onSelect,
}: {
  callType: CallType | null;
  onSelect: (c: CallType) => void;
}) {
  const opt = (value: CallType, label: string, first: boolean) => {
    const selected = callType === value;
    return (
      <button
        type="button"
        onClick={() => onSelect(value)}
        className={`${selected ? "seg-on" : "seg"} px-7 py-3 text-[17px] font-medium`}
        style={{ borderLeft: first ? "none" : "1px solid var(--border)" }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="inline-flex overflow-hidden"
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      {opt("kickoff", "Kick-off", true)}
      {opt("coaching", "Coaching", false)}
    </div>
  );
}
