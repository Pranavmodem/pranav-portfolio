import { createClient } from "@supabase/supabase-js";

// Publishable (anon) credentials — safe to expose; RLS only allows inserts.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://anifxfvhgymuzvessuuw.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UazP6XzSO4d4x1WY0YTyUw_e_y03Ze3";

export const supabase = createClient(url, key);
