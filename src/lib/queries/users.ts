import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/user";

function computeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, nim, avatar_url, currency, theme, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const name = profile?.full_name?.trim() || user.email?.split("@")[0] || "User";
  const theme = profile?.theme === "light" || profile?.theme === "dark" ? profile.theme : "system";

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    nim: profile?.nim ?? null,
    initials: computeInitials(name),
    avatarUrl: profile?.avatar_url ?? null,
    currency: profile?.currency ?? "IDR",
    theme,
    role: roleRow?.role === "admin" ? "admin" : "user",
    suspended: profile?.is_suspended ?? false,
  };
});
