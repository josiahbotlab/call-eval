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

  const canSubmit = callType !== null && transcript.trim().length >= 20 && !submitting;

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
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        QC Evaluator
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Run an evaluation</h1>
      <p className="mt-2 text-gray-500">
        Paste a call transcript, pick the call type, and score it against the
        12-dimension rubric.
      </p>

      {/* Call type cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <label htmlFor="transcript" className="text-sm font-medium text-gray-700">
            Transcript
          </label>
          <span className="text-xs text-gray-400">
            {transcript.length.toLocaleString()} characters
          </span>
        </div>
        <textarea
          id="transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste the full call transcript here…"
          className="h-72 w-full resize-y rounded-xl border border-gray-200 p-4 font-mono text-sm leading-relaxed shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? "Starting…" : "Run evaluation →"}
        </button>
        {callType === null && (
          <span className="text-sm text-gray-400">Pick a call type first.</span>
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
      className={`rounded-xl border p-5 text-left transition ${
        selected
          ? "border-gray-900 bg-gray-900 text-white shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="text-base font-semibold">{title}</div>
      <div
        className={`mt-1 text-sm ${selected ? "text-gray-300" : "text-gray-500"}`}
      >
        {desc}
      </div>
    </button>
  );
}
