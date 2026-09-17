import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isBillStatus, type AdminBillListItem, type AdminBillDetail, type BillStatus } from "@/types/bill";
import type { BillStatusFilter } from "@/lib/validations/pagination";

interface PaymentNested {
  amount: number;
  status: string;
}

interface BillRow {
  id: string;
  title: string;
  description: string;
  category: string;
  notes: string | null;
  reference: string | null;
  amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  audience: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  bill_assignments: Array<{
    id: string;
    user_id: string;
    assigned_at: string;
    payments: PaymentNested[] | null;
  }> | null;
}

function parseStatus(value: string): BillStatus {
  return isBillStatus(value) ? value : "active";
}

function toListItem(row: BillRow): AdminBillListItem {
  const assignments = row.bill_assignments ?? [];
  let verifiedTotal = 0;
  for (const a of assignments) {
    for (const p of a.payments ?? []) {
      if (p.status === "verified") verifiedTotal += Number(p.amount);
    }
  }
  const amount = Number(row.amount);
  return {
    bill: {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      notes: row.notes,
      reference: row.reference,
      amount,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      status: parseStatus(row.status),
      audience: row.audience === "all" ? "all" : "selected",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
    assignmentCount: assignments.length,
    verifiedTotal,
    remaining: Math.max(0, amount - verifiedTotal),
  };
}

function escapeLike(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export const getAdminBills = cache(
  async (params: {
    search?: string;
    status?: BillStatusFilter;
    page: number;
    perPage: number;
  }): Promise<{ items: AdminBillListItem[]; total: number }> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const esc = params.search ? escapeLike(params.search) : "";

    let query = supabase
      .from("bills")
      .select(
        "id, title, description, category, notes, reference, amount, issue_date, due_date, status, audience, created_by, created_at, updated_at, bill_assignments(id, user_id, assigned_at, payments(amount, status))",
        { count: "exact" }
      )
      .order("due_date", { ascending: false });

    if (esc) {
      query = query.or(`title.ilike.%${esc}%,reference.ilike.%${esc}%`);
    }
    if (params.status) {
      query = query.eq("status", params.status);
    }

    const from = (params.page - 1) * params.perPage;
    const to = from + params.perPage - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) return { items: [], total: 0 };

    return {
      items: (data as unknown as BillRow[]).map(toListItem),
      total: count ?? 0,
    };
  }
);

export const getAdminBillDetail = cache(
  async (billId: string): Promise<AdminBillDetail | null> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("bills")
      .select(
        "id, title, description, category, notes, reference, amount, issue_date, due_date, status, audience, created_by, created_at, updated_at, bill_assignments(id, user_id, assigned_at, payments(amount, status))"
      )
      .eq("id", billId)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as unknown as BillRow;
    const base = toListItem(row);

    // Resolve names separately: bill_assignments has no FK to profiles
    // (user_id references auth.users), so PostgREST cannot embed profiles.
    const userIds = [
      ...new Set((row.bill_assignments ?? []).map((a) => a.user_id)),
    ];
    const { data: profiles } =
      userIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds)
        : { data: [] };
    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id as string, p])
    );

    const assignments = (row.bill_assignments ?? []).map((a) => {
      let verifiedTotal = 0;
      for (const p of a.payments ?? []) {
        if (p.status === "verified") verifiedTotal += Number(p.amount);
      }
      const billAmount = Number(row.amount);
      const profile = profileById.get(a.user_id);
      return {
        assignmentId: a.id,
        userId: a.user_id,
        userName: profile?.full_name?.trim() || "(Tanpa nama)",
        email: profile?.email ?? null,
        assignedAt: a.assigned_at,
        verifiedTotal,
        remaining: Math.max(0, billAmount - verifiedTotal),
      };
    });

    return { ...base, assignments };
  }
);

export interface SelectableUser {
  id: string;
  name: string;
  email: string | null;
  nim: string | null;
}

/** Active (non-suspended) end-user accounts available for billing assignment. */
export const getSelectableUsers = cache(async (): Promise<SelectableUser[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "user");
  const endUserIds = (roleRows ?? []).map((r) => r.user_id as string);

  if (endUserIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, nim")
    .eq("is_suspended", false)
    .not("nim", "is", null)
    .in("id", endUserIds)
    .order("full_name", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    nim: string | null;
  }>).map((u) => ({
    id: u.id,
    name: u.full_name?.trim() || u.nim!,
    email: u.email,
    nim: u.nim,
  }));
});
