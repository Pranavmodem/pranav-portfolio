import { createClient } from "@supabase/supabase-js";

// Publishable (anon) credentials — safe to expose; RLS controls all access.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://anifxfvhgymuzvessuuw.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UazP6XzSO4d4x1WY0YTyUw_e_y03Ze3";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Server-side client acting as the user behind `token` (RLS-scoped). */
export function createUserClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Verifies a bearer token and returns the user, or null. */
export async function getUserFromToken(token: string | null) {
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Admin client for trusted server jobs (reminder cron). Bypasses RLS —
 * requires the service-role key, never expose it to the browser.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
