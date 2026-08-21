"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CallType } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [callType, setCallType] = useState<CallType | null>(null);
  const [transcript, setTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <main className="mx-auto flex h-screen max-w-4xl flex-col px-6 py-6">
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
        className="mono mt-3 w-full flex-1 resize-none p-4 text-xs leading-relaxed outline-none focus:border-[var(--border-strong)]"
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
          className="ml-auto px-4 py-1.5 text-[13px] font-semibold disabled:cursor-not-allowed"
          style={
            canSubmit
              ? {
                  background: "var(--accent)",
                  color: "var(--paper)",
                  borderRadius: "var(--radius)",
                }
              : {
                  background: "transparent",
                  color: "var(--ink-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }
          }
        >
          {submitting ? "Starting..." : "Run evaluation"}
        </button>
      </div>
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
        className="px-3 py-1.5 text-xs font-medium"
        style={{
          background: selected ? "var(--accent)" : "transparent",
          color: selected ? "var(--paper)" : "var(--ink-2)",
          borderLeft: first ? "none" : "1px solid var(--border)",
        }}
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
