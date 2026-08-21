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
    <main className="mx-auto max-w-2xl px-6 py-14">
      <p className="label">QC Evaluator</p>
      <h1
        className="mt-2 text-xl font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        Run an evaluation
      </h1>
      <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-2)" }}>
        Paste a call transcript, pick the call type, and score it against the
        12-dimension rubric.
      </p>

      {/* Call type */}
      <div className="mt-7">
        <p className="label mb-2">Call type</p>
        <div className="flex flex-col gap-px sm:flex-row sm:gap-2">
          <CardButton
            title="Kick-off call"
            desc="First call. Onboarding, goals, program, next steps."
            selected={callType === "kickoff"}
            onClick={() => setCallType("kickoff")}
          />
          <CardButton
            title="Coaching call"
            desc="Ongoing session. Check-in, coaching, accountability."
            selected={callType === "coaching"}
            onClick={() => setCallType("coaching")}
          />
        </div>
      </div>

      {/* Transcript */}
      <div className="mt-7">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="transcript" className="label">
            Transcript
          </label>
          <span className="mono text-[11px]" style={{ color: "var(--ink-3)" }}>
            {transcript.length.toLocaleString()} chars
          </span>
        </div>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the full call transcript here..."
          spellCheck={false}
          className="mono h-72 w-full resize-y p-3 text-xs leading-relaxed outline-none focus:border-[var(--border-strong)]"
          style={{
            background: "var(--field)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--ink)",
          }}
        />
      </div>

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

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 text-[13px] font-semibold disabled:cursor-not-allowed"
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
        {callType === null && (
          <span className="text-xs" style={{ color: "var(--ink-3)" }}>
            Pick a call type first.
          </span>
        )}
      </div>
    </main>
  );
}

function CardButton({
  title,
  desc,
  selected,
  onClick,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 p-3 text-left"
      style={{
        background: selected ? "var(--field)" : "transparent",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
      }}
    >
      <div
        className="text-[13px] font-semibold"
        style={{ color: selected ? "var(--accent)" : "var(--ink)" }}
      >
        {title}
      </div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--ink-3)" }}>
        {desc}
      </div>
    </button>
  );
}
