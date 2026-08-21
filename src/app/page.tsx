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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="label">QC Evaluator</p>
      <h1
        className="mt-3 text-3xl font-semibold tracking-tight"
        style={{ color: "var(--fg)" }}
      >
        Run an evaluation
      </h1>
      <p className="mt-2" style={{ color: "var(--fg-2)" }}>
        Paste a call transcript, pick the call type, and score it against the
        12-dimension rubric.
      </p>

      {/* Call type */}
      <div className="mt-8 grid grid-cols-1 gap-px sm:grid-cols-2">
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

      {/* Transcript */}
      <div className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <label htmlFor="transcript" className="label">
            Transcript
          </label>
          <span className="mono text-[11px]" style={{ color: "var(--fg-3)" }}>
            {transcript.length.toLocaleString()} chars
          </span>
        </div>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the full call transcript here…"
          spellCheck={false}
          className="mono h-72 w-full resize-y p-4 text-sm leading-relaxed outline-none transition-colors focus:border-[var(--border-strong)]"
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
          }}
        />
      </div>

      {error && (
        <p
          className="mt-4 pl-3 text-sm leading-relaxed"
          style={{
            color: "var(--fg-2)",
            borderLeft: "1px solid var(--band-fail)",
          }}
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed"
          style={
            canSubmit
              ? { background: "var(--accent)", color: "#0a0a0a" }
              : {
                  background: "transparent",
                  color: "var(--fg-3)",
                  border: "1px solid var(--border)",
                }
          }
        >
          {submitting ? "Starting…" : "Run evaluation"}
        </button>
        {callType === null && (
          <span className="text-sm" style={{ color: "var(--fg-3)" }}>
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
      className="p-5 text-left transition-colors"
      style={{
        background: selected ? "var(--panel)" : "transparent",
        border: `1px solid ${
          selected ? "var(--accent)" : "var(--border)"
        }`,
      }}
    >
      <div
        className="text-base font-medium"
        style={{ color: selected ? "var(--accent)" : "var(--fg)" }}
      >
        {title}
      </div>
      <div className="mt-1 text-sm" style={{ color: "var(--fg-3)" }}>
        {desc}
      </div>
    </button>
  );
}
