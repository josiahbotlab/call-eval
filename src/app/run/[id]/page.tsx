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
        <p className="text-gray-500">Evaluation not found.</p>
        <Link href="/" className="mt-3 text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
      </Centered>
    );
  }

  if (row?.status === "failed") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-red-700">
          Evaluation failed
        </h1>
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {row.error || "The scoring run failed without an error message."}
        </div>
      </main>
    );
  }

  if (row?.status === "completed" && row.result) {
    return <Report result={row.result} createdAt={row.created_at} />;
  }

  // pending / processing / initial load
  return (
    <Centered>
      <Spinner />
      <p className="mt-4 font-medium text-gray-700">Evaluating transcript…</p>
      <p className="mt-1 text-sm text-gray-400">
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

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-800" />
  );
}
