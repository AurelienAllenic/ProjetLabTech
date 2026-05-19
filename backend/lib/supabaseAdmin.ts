import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let supabaseAdmin: ReturnType<typeof createClient> | undefined;

export function getSupabaseAdmin(): ReturnType<typeof createClient> {
  supabaseAdmin ??= createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }
  );

  return supabaseAdmin;
}
