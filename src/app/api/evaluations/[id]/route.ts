import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("evaluations")
    // deliberately NOT selecting `transcript` — it's large and the client
    // doesn't need it back.
    .select("id, call_type, status, error, result, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return Response.json({ error: "Evaluation not found." }, { status: 404 });
  }

  return Response.json(data);
}
