import { cache } from "react";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/user";
import { createClient } from "@/lib/supabase/server";

function normalizeRole(value: string | undefined | null): UserRole {
  return value === "admin" ? "admin" : "user";
}

/** Role lookup against the trusted user_roles table (RLS scoped to own row). */
export async function getUserRoleFromClient(
  supabase: Pick<SupabaseClient<Database>, "from">,
  userId: string
): Promise<UserRole> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return normalizeRole(data?.role);
}

export const getUserRole = cache(async (): Promise<UserRole> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "user";
  return getUserRoleFromClient(supabase, user.id);
});
