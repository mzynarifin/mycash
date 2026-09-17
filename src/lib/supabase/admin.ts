import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SECURITY: privileged Supabase client.
// - Server-only. Never import this module from a Client Component.
// - Never serialize the key to the browser bundle.
// - Used exclusively for privileged admin operations that must
//   bypass RLS (creating auth users, audit inserts, suspensions).
export function createAdminClient(): SupabaseClient<Database> | null {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}