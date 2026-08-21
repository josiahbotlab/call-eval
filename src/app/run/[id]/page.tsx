"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { EvaluationRow } from "@/lib/types";
import Report from "@/components/Report";

export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [row, setRow] = useState<EvaluationRow | null>(null);
  const [notFound, setNotFound] = useState(false);
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
        // transient error — keep polling
      }
      if (!stopped.current) timer = setTimeout(poll, 2000);
    }

    poll();
    return () => {
      stopped.current = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (notFound) {
    return (
      <Centered>
        <p style={{ color: "var(--fg-2)" }}>Evaluation not found.</p>
        <Link
          href="/"
          className="mono mt-3 text-xs transition-colors hover:text-[var(--fg)]"
          style={{ color: "var(--fg-3)" }}
        >
          ← Back
        </Link>
      </Centered>
    );
  }

  if (row?.status === "failed") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="mono text-xs transition-colors hover:text-[var(--fg)]"
          style={{ color: "var(--fg-3)" }}
        >
          ← Back
        </Link>
        <p className="label mt-6" style={{ color: "var(--band-fail)" }}>
          Evaluation failed
        </p>
        <p
          className="mt-3 pl-3 text-sm leading-relaxed"
          style={{
            color: "var(--fg-2)",
            borderLeft: "1px solid var(--band-fail)",
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

  // pending / processing / initial load — just the word, subtly pulsing.
  return (
    <Centered>
      <p
        className="pulse text-2xl font-semibold tracking-tight"
        style={{ color: "var(--fg)" }}
      >
        Scoring…
      </p>
      <p className="mono mt-3 text-xs" style={{ color: "var(--fg-3)" }}>
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
