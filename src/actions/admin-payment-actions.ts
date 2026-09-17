"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminReviewPaymentSchema } from "@/lib/validations/admin";
import { getUserRoleFromClient } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import { revalidatePaymentPaths } from "@/lib/revalidation";
import type { ActionResult } from "@/actions/types";

export async function reviewPaymentAction(input: {
  paymentId: string;
  decision: "verified" | "rejected";
  rejectReason?: string;
}): Promise<ActionResult> {
  const parsed = adminReviewPaymentSchema.safeParse(input);
  const decision = input.decision;
  if (!parsed.success) {
    return {
      success: false,
      message:
        decision === "rejected"
          ? "Alasan penolakan wajib diisi."
          : "Data keputusan tidak valid.",
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
  if ((await getUserRoleFromClient(supabase, user.id)) !== "admin") {
    return { success: false, message: "Akses ditolak." };
  }

  if (parsed.data.decision === "verified") {
    // Conditional update: only a still-pending payment may be verified.
    // Prevents double-counting from repeated clicks / stale admin screens.
    const admin = createAdminClient();
    if (!admin) {
      return { success: false, message: "Konfigurasi server tidak lengkap." };
    }

    const { data: updated, error } = await admin
      .from("payments")
      .update({
        status: "verified",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.paymentId)
      .eq("status", "pending")
      .select("assignment_id")
      .maybeSingle();

    if (error || !updated) {
      return {
        success: false,
        message: "Pembayaran sudah diproses atau tidak ditemukan.",
      };
    }

    await writeAuditLog({
      actorId: user.id,
      action: "payment.verify",
      entityType: "payments",
      entityId: parsed.data.paymentId,
      detail: { assignmentId: updated.assignment_id },
    });

    revalidatePaymentPaths();
    return { success: true };
  }

  // Rejection requires a reason.
  const reason = parsed.data.rejectReason?.trim() ?? "";
  if (!reason) {
    return { success: false, message: "Alasan penolakan wajib diisi." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: updated, error } = await admin
    .from("payments")
    .update({
      status: "rejected",
      reject_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.paymentId)
    .eq("status", "pending")
    .select("assignment_id")
    .maybeSingle();

  if (error || !updated) {
    return { success: false, message: "Pembayaran sudah diproses atau tidak ditemukan." };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "payment.reject",
    entityType: "payments",
    entityId: parsed.data.paymentId,
    detail: { assignmentId: updated.assignment_id },
  });

  revalidatePaymentPaths();
  return { success: true };
}
