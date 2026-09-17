"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations/payment";
import { parseAmount } from "@/lib/formatters";
import { revalidatePaymentPaths } from "@/lib/revalidation";
import type { ActionResult } from "@/actions/types";

export async function submitPaymentAction(input: {
  assignmentId: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  proofObject?: string;
}): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentDate: input.paymentDate,
    notes: input.notes,
    reference: input.reference,
    proofObject: input.proofObject,
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Data pembayaran tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "Sesi Anda telah berakhir. Silakan login kembali." };
  }

  // Load the assignment + bill to verify ownership and constraints.
  const { data: assignment, error: assignErr } = await supabase
    .from("bill_assignments")
    .select("id, amount, bill_id, bills(title, amount, status, due_date)")
    .eq("id", input.assignmentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (assignErr || !assignment) {
    return { success: false, message: "Tagihan tidak ditemukan atau tidak dapat diakses." };
  }

  const bill = assignment.bills as {
    title: string;
    amount: number;
    status: string;
    due_date: string;
  } | null;

  if (!bill || bill.status !== "active") {
    return { success: false, message: "Tagihan sudah tidak aktif." };
  }

  // Batas nominal = porsi per user (total tagihan / jumlah user).
  const share = Number(assignment.amount) || Number(bill.amount) || 0;

  const amount = parseAmount(parsed.data.amount);
  if (amount <= 0 || amount > share) {
    return { success: false, message: "Nominal pembayaran tidak valid." };
  }

  // Compute remaining balance.
  const { data: committedRows } = await supabase
    .from("payments")
    .select("amount, status")
    .eq("assignment_id", input.assignmentId)
    .in("status", ["verified", "pending"]);

  const paid = (committedRows ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const remaining = share - paid;

  if (amount > remaining) {
    return { success: false, message: "Nominal melebihi sisa tagihan." };
  }

  const proofObject = parsed.data.proofObject?.trim() || "";
  if (proofObject && !proofObject.startsWith(`${user.id}/`)) {
    return { success: false, message: "Bukti pembayaran tidak valid." };
  }

  const { error } = await supabase.from("payments").insert({
    assignment_id: input.assignmentId,
    user_id: user.id,
    amount,
    payment_method: parsed.data.paymentMethod,
    payment_date: parsed.data.paymentDate,
    reference: parsed.data.reference?.trim() || null,
    notes: parsed.data.notes?.trim() || null,
    proof_object: proofObject || null,
  });

  if (error) {
    if (error.code === "42501") {
      return { success: false, message: "Anda tidak memiliki akses untuk membayar tagihan ini." };
    }
    return { success: false, message: "Terjadi kesalahan saat mengirim pembayaran." };
  }

  revalidatePaymentPaths();
  return { success: true };
}
