import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized clients. Do NOT instantiate at module level — the Next.js
// build evaluates modules without env vars, and a top-level createClient() with
// undefined URL/keys throws and breaks the build.

let admin: SupabaseClient | null = null;

/** Server-only client using the service-role key (bypasses RLS). */
export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }
    admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return admin;
}

let browser: SupabaseClient | null = null;

/** Anon client (available client-side). Unused by the current UI, which talks
 *  to the API routes, but provided for completeness / future direct reads. */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browser) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    browser = createClient(url, key);
  }
  return browser;
}
