"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { EvaluationRow } from "@/lib/types";
import Report from "@/components/Report";

const STATUS_MESSAGES = [
  "Reading transcript...",
  "Scoring dimensions...",
  "Analyzing evidence...",
  "Building report...",
  "Finalizing scores...",
];

export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [row, setRow] = useState<EvaluationRow | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const stopped = useRef(false);

  useEffect(() => {
    stopped.current = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/evaluations/${id}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!stopped.current) setNotFound(true);
          return;
        }
        const data = (await res.json()) as EvaluationRow;
        if (stopped.current) return;
        setRow(data);
        if (data.status === "completed" || data.status === "failed") return;
      } catch {
        // transient error - keep polling
      }
      if (!stopped.current) timer = setTimeout(poll, 2000);
    }

    poll();
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, [id]);

  const loading =
    !notFound &&
    row?.status !== "failed" &&
    !(row?.status === "completed" && row.result);

  // Cycle the status text every 3.5s while scoring is in progress.
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(
      () => setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length),
      3500
    );
    return () => clearInterval(t);
  }, [loading]);

  if (notFound) {
    return (
      <Centered>
        <p style={{ color: "var(--ink-2)" }}>Evaluation not found.</p>
        <Link
          href="/"
          className="mt-3 text-xs hover:text-[var(--ink)]"
          style={{ color: "var(--ink-3)" }}
        >
          &lt; Back
        </Link>
      </Centered>
    );
  }

  if (row?.status === "failed") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-14">
        <Link
          href="/"
          className="text-xs hover:text-[var(--ink)]"
          style={{ color: "var(--ink-3)" }}
        >
          &lt; Back
        </Link>
        <p className="label mt-5" style={{ color: "var(--accent)" }}>
          Evaluation failed
        </p>
        <p
          className="mt-2 pl-2.5 text-[13px] leading-relaxed"
          style={{
            color: "var(--ink-2)",
            borderLeft: "1px solid var(--accent)",
          }}
        >
          {row.error || "The scoring run failed without an error message."}
        </p>
      </main>
    );
  }

  if (row?.status === "completed" && row.result) {
    return <Report result={row.result} createdAt={row.created_at} />;
  }

  // pending / processing / initial load - cycling status text + thin fill line.
  return (
    <Centered>
      <p
        key={msgIndex}
        className="status-fade text-base font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        {STATUS_MESSAGES[msgIndex]}
      </p>
      <div className="progress-track mt-4">
        <span />
      </div>
      <p className="mt-4 text-xs" style={{ color: "var(--ink-3)" }}>
        You can close this tab and come back.
      </p>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {children}
    </main>
  );
}
