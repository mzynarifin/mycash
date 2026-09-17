import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isBillStatus, type Bill, type UserBill } from "@/types/bill";

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
}

interface AssignmentRow {
  id: string;
  amount: number | null;
  assigned_at: string;
  bills: BillRow | null;
  payments: PaymentRow[] | null;
}

interface PaymentRow {
  amount: number;
  status: string;
  reject_reason?: string | null;
  created_at?: string;
}

function mapBill(raw: BillRow): Bill {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    notes: raw.notes,
    reference: raw.reference,
    amount: Number(raw.amount),
    issueDate: raw.issue_date,
    dueDate: raw.due_date,
    status: isBillStatus(raw.status) ? raw.status : "active",
    audience: raw.audience === "all" ? "all" : "selected",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function sumVerified(payments: PaymentRow[] | null): number {
  return (payments ?? []).reduce(
    (sum, p) => (p.status === "verified" ? sum + Number(p.amount) : sum),
    0
  );
}

/** All bills assigned to the current user, with paid/remaining. */
export const getUserBills = cache(async (): Promise<UserBill[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("bill_assignments")
    .select(
      "id, amount, assigned_at, bills(id, title, description, category, notes, reference, amount, issue_date, due_date, status, audience, created_by, created_at, updated_at), payments(amount, status, reject_reason, created_at)"
    )
    .order("assigned_at", { ascending: false });

  if (error || !data) return [];

  const bills: UserBill[] = [];
  for (const row of data as AssignmentRow[]) {
    if (!row.bills) continue;
    const bill = mapBill(row.bills);
    const payments = row.payments ?? [];
    // Nominal per user = porsi bagian: total tagihan dibagi jumlah user.
    const share = Number(row.amount) || bill.amount;
    const paidAmount = sumVerified(payments);
    const pendingAmount = payments.reduce((sum, payment) => payment.status === "pending" ? sum + Number(payment.amount) : sum, 0);
    const latestRejectedReason = [...payments].reverse().find((payment) => payment.status === "rejected")?.reject_reason ?? null;
    bills.push({
      assignmentId: row.id,
      bill: { ...bill, amount: share },
      paidAmount,
      pendingAmount,
      latestRejectedReason,
      remaining: Math.max(0, share - paidAmount),
    });
  }

  return bills;
});

/** Active assigned bills the user still owes, nearest due date first. */
export async function getUpcomingBills(limit = 4): Promise<UserBill[]> {
  const bills = await getUserBills();
  return bills
    .filter((b) => b.bill.status === "active" && b.remaining > 0)
    .sort((a, b) => a.bill.dueDate.localeCompare(b.bill.dueDate))
    .slice(0, limit);
}

export interface UnpaidBillSummary {
  count: number;
  amount: number;
}

export async function getUnpaidBillSummary(): Promise<UnpaidBillSummary> {
  const bills = await getUserBills();
  const unpaid = bills.filter((b) => b.bill.status === "active" && b.remaining > 0);
  return {
    count: unpaid.length,
    amount: unpaid.reduce((sum, b) => sum + b.remaining, 0),
  };
}
