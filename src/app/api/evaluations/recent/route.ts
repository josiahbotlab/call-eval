import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Last 10 completed evaluations, newest first. Pulls total_score / band /
// max_possible out of the result jsonb so the home page can list past runs
// without fetching the full result payload.
export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("evaluations")
    .select(
      "id, call_type, created_at, total_score:result->>total_score, band:result->>band, max_possible:result->>max_possible"
    )
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((r) => ({
    id: r.id as string,
    call_type: r.call_type as string,
    total_score: r.total_score != null ? Number(r.total_score) : null,
    band: (r.band as string | null) ?? null,
    max_possible: r.max_possible != null ? Number(r.max_possible) : 100,
    created_at: r.created_at as string,
  }));

  return Response.json(rows);
}
