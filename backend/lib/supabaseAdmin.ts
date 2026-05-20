import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseAdmin: SupabaseClient<any> | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any> {
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
