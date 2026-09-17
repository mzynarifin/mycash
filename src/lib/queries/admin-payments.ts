import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPaymentMethod } from "@/lib/payment-methods";
import { isPaymentStatus, type AdminPaymentListItem } from "@/types/payment";
import { getProofUrl } from "@/lib/payments";
import type { PaymentStatusFilter } from "@/lib/validations/pagination";

interface AdminPaymentRow {
  id: string;
  assignment_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  reject_reason: string | null;
  notes: string | null;
  reference: string | null;
  created_at: string;
  proof_object: string | null;
  assignment: {
    bill_id: string;
    user_id: string;
    bills: { id: string; title: string; amount: number } | null;
  } | null;
}

export const getAdminPayments = cache(
  async (params: {
    status?: PaymentStatusFilter;
    from?: string;
    to?: string;
    page: number;
    perPage: number;
  }): Promise<{ items: AdminPaymentListItem[]; total: number }> => {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let query = supabase
      .from("payments")
      .select(
        "id, assignment_id, user_id, amount, payment_method, payment_date, status, reject_reason, notes, reference, created_at, proof_object, assignment:bill_assignments(bill_id, user_id, bills(id, title, amount))",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (params.status) query = query.eq("status", params.status);
    if (params.from) query = query.gte("created_at", params.from);
    if (params.to) query = query.lte("created_at", params.to);

    const from = (params.page - 1) * params.perPage;
    const to = from + params.perPage - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) return { items: [], total: 0 };
    const rows = data as unknown as AdminPaymentRow[];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [...new Set(rows.map((row) => row.user_id))]);
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    const items = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: profileById.get(row.user_id)?.full_name?.trim() || "(Tanpa nama)",
      email: profileById.get(row.user_id)?.email ?? null,
      billId: row.assignment?.bill_id ?? "",
      billTitle: row.assignment?.bills?.title ?? "Tagihan",
      billAmount: Number(row.assignment?.bills?.amount ?? 0),
      amount: Number(row.amount),
      paymentMethod: isPaymentMethod(row.payment_method) ? row.payment_method : "other",
      paymentDate: row.payment_date,
      status: isPaymentStatus(row.status) ? row.status : "pending",
      rejectReason: row.reject_reason,
      notes: row.notes,
      reference: row.reference,
      createdAt: row.created_at,
      proofObject: row.proof_object,
      proofUrl: getProofUrl(row.proof_object),
    }));

    return { items, total: count ?? 0 };
  }
);
