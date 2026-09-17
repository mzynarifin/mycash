import { cache } from "react";
import { format } from "date-fns";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPaymentMethod } from "@/lib/payment-methods";
import { isPaymentStatus, type AdminPaymentListItem } from "@/types/payment";
import { getProofUrl } from "@/lib/payments";
import type { AuditEvent } from "@/types/audit";
import type { AdminDashboardData } from "@/types/dashboard";

interface BillWithPayments {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  status: string;
  bill_assignments: Array<{
    id: string;
    payments: Array<{ amount: number; status: string }> | null;
  }> | null;
}

interface RecentPaymentRow {
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
  reviewed_at: string | null;
  proof_object: string | null;
  assignment: { bill_id: string } | null;
}

export const getAdminDashboard = cache(async (): Promise<AdminDashboardData> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const today = format(new Date(), "yyyy-MM-dd");

  const [
    { count: activeUsers },
    { count: pendingPaymentCount },
    { data: activeBillRows },
    { data: recentPayRows },
    { data: auditRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_suspended", false),

    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("bills")
      .select(
        "id, title, amount, due_date, status, bill_assignments(id, payments(amount, status))"
      )
      .eq("status", "active")
      .order("due_date", { ascending: true }),

    supabase
      .from("payments")
      .select(
        "id, assignment_id, user_id, amount, payment_method, payment_date, status, reject_reason, notes, reference, created_at, reviewed_at, proof_object, assignment:bill_assignments(bill_id)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("audit_logs")
      .select("id, actor_id, action, entity_type, entity_id, detail, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Resolve bill titles and payer names separately to avoid depending on
  // PostgREST schema-cache relations that are not always registered.
  const recentRows = (recentPayRows ?? []) as unknown as RecentPaymentRow[];
  const recentBillIds = [
    ...new Set(
      recentRows
        .map((r) => r.assignment?.bill_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const pendingUserIds = [...new Set(recentRows.map((row) => row.user_id))];
  const [recentBillsResult, pendingProfileResult] = await Promise.all([
    recentBillIds.length > 0
      ? supabase.from("bills").select("id, title, amount").in("id", recentBillIds)
      : { data: [] },
    pendingUserIds.length > 0
      ? supabase.from("profiles").select("id, full_name, email").in("id", pendingUserIds)
      : { data: [] },
  ]);
  const recentBillById = new Map(
    ((recentBillsResult.data ?? []) as Array<{ id: string; title: string; amount: number }>).map(
      (b) => [b.id, b]
    )
  );
  const pendingProfileById = new Map(
    ((pendingProfileResult.data ?? []) as Array<{
      id: string;
      full_name: string;
      email: string | null;
    }>).map((p) => [p.id, p])
  );

  const bills = (activeBillRows ?? []) as unknown as BillWithPayments[];
  const todayDate = new Date(today);

  let outstandingBillAmount = 0;
  let overdueAssignments = 0;

  const upcomingDueBills: AdminDashboardData["upcomingDueBills"] = [];

  for (const bill of bills) {
    const billAmount = Number(bill.amount);
    let totalVerified = 0;
    let overdueAssignmentsForBill = 0;

    for (const a of bill.bill_assignments ?? []) {
      const verified = (a.payments ?? [])
        .filter((p) => p.status === "verified")
        .reduce((sum, p) => sum + Number(p.amount), 0);
      totalVerified += verified;
      const remaining = billAmount - verified;
      if (remaining > 0 && new Date(bill.due_date) < todayDate) {
        overdueAssignmentsForBill += 1;
      }
    }

    outstandingBillAmount += Math.max(0, billAmount - totalVerified);
    overdueAssignments += overdueAssignmentsForBill;

    if (upcomingDueBills.length < 5) {
      const totalPaid = totalVerified;
      upcomingDueBills.push({
        id: bill.id,
        title: bill.title,
        amount: billAmount,
        dueDate: bill.due_date,
        remaining: Math.max(0, billAmount - totalPaid),
      });
    }
  }

  const recentPendingPayments = recentRows.map((row) => {
    const bill = recentBillById.get(row.assignment?.bill_id ?? "");
    return {
      id: row.id,
      userId: row.user_id,
      userName:
        pendingProfileById.get(row.user_id)?.full_name?.trim() || "(Tanpa nama)",
      email: pendingProfileById.get(row.user_id)?.email ?? null,
      billId: row.assignment?.bill_id ?? "",
      billTitle: bill?.title ?? "Tagihan",
      billAmount: Number(bill?.amount ?? 0),
      amount: Number(row.amount),
      paymentMethod: isPaymentMethod(row.payment_method)
        ? (row.payment_method as "cash")
        : "other",
      paymentDate: row.payment_date,
      status: isPaymentStatus(row.status) ? (row.status as "pending") : "pending",
      rejectReason: row.reject_reason,
      notes: row.notes,
      reference: row.reference,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      proofObject: row.proof_object,
      proofUrl: getProofUrl(row.proof_object),
    };
  }) as AdminPaymentListItem[];

  const recentAuditEvents: AuditEvent[] = (auditRows ?? []).map(
    (row: Record<string, unknown>) => ({
      id: row.id as string,
      actorId: row.actor_id as string | null,
      action: row.action as string,
      entityType: row.entity_type as string,
      entityId: row.entity_id as string | null,
      detail: (row.detail as AdminDashboardData["recentAuditEvents"][0]["detail"]) ?? null,
      createdAt: row.created_at as string,
    })
  );

  return {
    activeUsers: activeUsers ?? 0,
    activeBills: bills.length,
    outstandingBillAmount,
    pendingPaymentCount: pendingPaymentCount ?? 0,
    overdueAssignments,
    upcomingDueBills,
    recentPendingPayments,
    recentAuditEvents,
  };
});
