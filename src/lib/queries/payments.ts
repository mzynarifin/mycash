import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isPaymentMethod } from "@/lib/payment-methods";
import { isPaymentStatus, type Payment } from "@/types/payment";

interface PaymentAssignmentRow {
  bill_id: string;
  bills: { id: string; title: string; due_date: string } | null;
}

interface PaymentRow {
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
  reviewed_at: string | null;
  created_at: string;
  proof_object: string | null;
  assignment: PaymentAssignmentRow | null;
}

/** Payments submitted by the current user. */
export const getPayments = cache(async (): Promise<Payment[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, assignment_id, user_id, amount, payment_method, payment_date, status, reject_reason, notes, reference, reviewed_at, created_at, proof_object, assignment:bill_assignments(bill_id, bills(id, title, due_date))"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as unknown as PaymentRow[]).map((row) => ({
    id: row.id,
    assignmentId: row.assignment_id,
    userId: row.user_id,
    amount: Number(row.amount),
    paymentMethod: isPaymentMethod(row.payment_method) ? row.payment_method : "other",
    paymentDate: row.payment_date,
    status: isPaymentStatus(row.status) ? row.status : "pending",
    rejectReason: row.reject_reason,
    notes: row.notes,
    reference: row.reference,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    billTitle: row.assignment?.bills?.title ?? "Tagihan",
    billDueDate: row.assignment?.bills?.due_date ?? "",
    proofObject: row.proof_object,
  }));
});
