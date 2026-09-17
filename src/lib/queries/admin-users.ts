import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/user";
import type { AdminUserStatusFilter } from "@/lib/validations/pagination";

interface RoleRow {
  user_id: string;
  role: string;
}

interface ProfileEmbedded {
  id: string;
  full_name: string;
  email: string | null;
  nim: string | null;
  is_suspended: boolean;
  created_at: string;
  currency: string;
  theme: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string | null;
  nim: string | null;
  role: UserRole;
  suspended: boolean;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  currency: string;
  theme: string;
  assignmentCount: number;
  expenseCount: number;
  verifiedPaymentTotal: number;
  pendingPaymentCount: number;
}

export interface AdminUserListResult {
  items: AdminUserListItem[];
  total: number;
}

export const getAdminUsers = cache(
  async (params: {
    search?: string;
    status?: AdminUserStatusFilter;
    page: number;
    perPage: number;
  }): Promise<AdminUserListResult> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.from("user_roles").select("user_id, role");

    if (error || !data) return { items: [], total: 0 };
    const roleRows = data as RoleRow[];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, email, nim, is_suspended, created_at")
      .in("id", roleRows.map((row) => row.user_id));
    const profileById = new Map(
      ((profileRows ?? []) as ProfileEmbedded[]).map((profile) => [profile.id, profile])
    );

    let rows: AdminUserListItem[] = roleRows.map(
      (r) => {
        const profile = profileById.get(r.user_id);
        return ({
        id: r.user_id,
        name: profile?.full_name?.trim() || "(Tanpa nama)",
        email: profile?.email ?? null,
        nim: profile?.nim ?? null,
        role: r.role === "admin" ? "admin" : "user",
        suspended: profile?.is_suspended ?? false,
        createdAt: profile?.created_at ?? "",
      });
      }
    );

    // ── filters ──
    const search = params.search?.trim().toLowerCase() ?? "";
    if (search) {
      const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(pattern) ||
          (r.nim?.includes(pattern) ?? false)
      );
    }

    if (params.status === "suspended") {
      rows = rows.filter((r) => r.suspended);
    } else if (params.status === "active") {
      rows = rows.filter((r) => !r.suspended);
    }

    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = rows.length;
    const start = (params.page - 1) * params.perPage;
    const items = rows.slice(start, start + params.perPage);

    return { items, total };
  }
);

export const getAdminUserDetail = cache(
  async (userId: string): Promise<AdminUserDetail | null> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleErr || !roleRow) return null;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, nim, is_suspended, currency, theme, created_at")
      .eq("id", userId)
      .maybeSingle();

    const [
      { count: assignmentCount },
      { count: expenseCount },
      { data: paymentRows },
    ] = await Promise.all([
      supabase
        .from("bill_assignments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("payments")
        .select("amount, status")
        .eq("user_id", userId),
    ]);

    const payments = (paymentRows ?? []) as Array<{ amount: number; status: string }>;
    const verifiedPaymentTotal = payments
      .filter((p) => p.status === "verified")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPaymentCount = payments.filter((p) => p.status === "pending").length;

    return {
      id: (roleRow as RoleRow).user_id,
      name: profiles?.full_name?.trim() || "(Tanpa nama)",
      email: profiles?.email ?? null,
      nim: profiles?.nim ?? null,
      role: (roleRow as RoleRow).role === "admin" ? "admin" : "user",
      suspended: profiles?.is_suspended ?? false,
      createdAt: profiles?.created_at ?? "",
      currency: profiles?.currency ?? "IDR",
      theme: profiles?.theme ?? "system",
      assignmentCount: assignmentCount ?? 0,
      expenseCount: expenseCount ?? 0,
      verifiedPaymentTotal,
      pendingPaymentCount,
    };
  }
);
