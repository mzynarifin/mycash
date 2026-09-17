"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assignBillSchema,
  createBillSchema,
  updateBillSchema,
} from "@/lib/validations/billing";
import { parseAmount } from "@/lib/formatters";
import { getUserRoleFromClient } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import { revalidateBillPaths } from "@/lib/revalidation";
import type { ActionResult } from "@/actions/types";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: {
        success: false,
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      } as ActionResult,
    };
  }
  const role = await getUserRoleFromClient(supabase, user.id);
  if (role !== "admin") {
    return { error: { success: false, message: "Akses ditolak." } as ActionResult };
  }
  return { user };
}

export async function createBillAction(input: {
  title: string;
  description?: string;
  category: string;
  notes?: string;
  reference?: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  userIds: string[];
  assignmentMode: "single" | "multiple" | "all";
}): Promise<ActionResult> {
  const parsed = createBillSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data tagihan tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  // Only assign to existing, non-suspended end users (role=user with a NIM).
  const { data: userRoleRows } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "user");
  const endUserIds = (userRoleRows ?? []).map((r) => r.user_id as string);

  let profileQuery = admin
    .from("profiles")
    .select("id")
    .eq("is_suspended", false)
    .not("nim", "is", null)
    .in("id", endUserIds);
  if (parsed.data.assignmentMode !== "all") {
    profileQuery = profileQuery.in("id", parsed.data.userIds);
  }
  const { data: profiles } = await profileQuery;

  const validIds = new Set((profiles ?? []).map((p) => p.id as string));
  const userIds =
    parsed.data.assignmentMode === "all"
      ? [...validIds]
      : parsed.data.userIds.filter((id) => validIds.has(id));
  if (userIds.length === 0) {
    return { success: false, message: "Pilih minimal satu user yang valid." };
  }

  const { data: bill, error } = await admin
    .from("bills")
    .insert({
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      category: parsed.data.category.trim(),
      notes: parsed.data.notes?.trim() || null,
      reference: parsed.data.reference?.trim() || null,
      amount: parseAmount(parsed.data.amount),
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate,
      audience: parsed.data.assignmentMode === "all" ? "all" : "selected",
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (error || !bill) {
    return { success: false, message: "Terjadi kesalahan saat membuat tagihan." };
  }

  const { error: assignErr } = await admin.from("bill_assignments").insert(
    userIds.map((userId) => ({ bill_id: bill.id, user_id: userId }))
  );

  if (assignErr) {
    await admin.from("bills").delete().eq("id", bill.id);
    return { success: false, message: "Terjadi kesalahan saat menugaskan tagihan." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.create",
    entityType: "bills",
    entityId: bill.id,
    detail: { title: parsed.data.title.trim(), amount: parseAmount(parsed.data.amount) },
  });
  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.assign",
    entityType: "bills",
    entityId: bill.id,
    detail: { userIds },
  });

  revalidateBillPaths();
  return { success: true };
}

export async function updateBillAction(input: {
  id: string;
  title: string;
  description?: string;
  category: string;
  notes?: string;
  reference?: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  audience?: "selected" | "all";
}): Promise<ActionResult> {
  const parsed = updateBillSchema.safeParse({ ...input, audience: input.audience ?? "selected" });
  if (!parsed.success) {
    return {
      success: false,
      message: "Data tagihan tidak valid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: updated, error } = await admin
    .from("bills")
    .update({
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      category: parsed.data.category.trim(),
      notes: parsed.data.notes?.trim() || null,
      reference: parsed.data.reference?.trim() || null,
      amount: parseAmount(parsed.data.amount),
      issue_date: parsed.data.issueDate,
      due_date: parsed.data.dueDate,
      audience: parsed.data.audience,
    })
    .eq("id", parsed.data.id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return {
      success: false,
      message: "Tagihan tidak ditemukan atau sudah tidak aktif.",
    };
  }

  // Beralih ke "semua user": tugaskan ke seluruh user aktif saat ini.
  // Pendaftar baru otomatis ditangani trigger assign_broadcast_bills.
  if (parsed.data.audience === "all") {
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "user");
    const endUserIds = (roleRows ?? []).map((r) => r.user_id as string);

    if (endUserIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id")
        .eq("is_suspended", false)
        .not("nim", "is", null)
        .in("id", endUserIds);
      const userIds = (profiles ?? []).map((p) => p.id as string);
      if (userIds.length > 0) {
        await admin
          .from("bill_assignments")
          .upsert(
            userIds.map((userId) => ({ bill_id: parsed.data.id, user_id: userId })),
            { onConflict: "bill_id,user_id", ignoreDuplicates: true }
          );
      }
    }
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.update",
    entityType: "bills",
    entityId: parsed.data.id,
    detail: { title: parsed.data.title.trim(), audience: parsed.data.audience },
  });

  revalidateBillPaths();
  return { success: true };
}

export async function cancelBillAction(id: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: updated, error } = await admin
    .from("bills")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { success: false, message: "Tagihan tidak ditemukan atau sudah tidak aktif." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.cancel",
    entityType: "bills",
    entityId: id,
  });

  revalidateBillPaths();
  return { success: true };
}

export async function archiveBillAction(id: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) return { success: false, message: "Konfigurasi server tidak lengkap." };

  const { data: updated, error } = await admin
    .from("bills")
    .update({ status: "archived" })
    .eq("id", id)
    .neq("status", "archived")
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { success: false, message: "Tagihan tidak ditemukan atau sudah diarsipkan." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.archive",
    entityType: "bills",
    entityId: id,
  });
  revalidateBillPaths();
  return { success: true };
}

export async function deleteBillAction(id: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) return { success: false, message: "Konfigurasi server tidak lengkap." };

  const { data: bill } = await admin
    .from("bills")
    .select("id, title, amount")
    .eq("id", id)
    .maybeSingle();
  if (!bill) return { success: false, message: "Tagihan tidak ditemukan." };

  const { data: assignmentRows } = await admin
    .from("bill_assignments")
    .select("id")
    .eq("bill_id", id);
  const assignmentIds = (assignmentRows ?? []).map((a) => a.id as string);

  const { data: paymentRows } =
    assignmentIds.length > 0
      ? await admin
          .from("payments")
          .select("id, proof_object")
          .in("assignment_id", assignmentIds)
      : { data: [] };
  const proofs = (paymentRows ?? [])
    .map((p) => p.proof_object as string | null)
    .filter((p): p is string => Boolean(p));

  // Cascade menghapus assignments + payments. Riwayat ikut terhapus.
  const { error } = await admin.from("bills").delete().eq("id", id);
  if (error) {
    return { success: false, message: "Terjadi kesalahan saat menghapus tagihan." };
  }

  if (proofs.length > 0) {
    await admin.storage.from("bukti-pembayaran").remove(proofs);
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.delete",
    entityType: "bills",
    entityId: id,
    detail: {
      title: bill.title,
      amount: Number(bill.amount),
      assignments: assignmentIds.length,
      payments: (paymentRows ?? []).length,
    },
  });
  revalidateBillPaths();
  return { success: true };
}

export async function assignBillAction(input: {
  billId: string;
  userIds: string[];
}): Promise<ActionResult> {
  const parsed = assignBillSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data penugasan tidak valid." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const auth = await requireAdmin(supabase);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  if (!admin) {
    return { success: false, message: "Konfigurasi server tidak lengkap." };
  }

  const { data: existing } = await admin
    .from("bill_assignments")
    .select("user_id")
    .eq("bill_id", parsed.data.billId);

  const existingIds = new Set((existing ?? []).map((r) => r.user_id as string));

  const { data: profiles } = await admin
    .from("profiles")
    .select("id")
    .in("id", parsed.data.userIds)
    .eq("is_suspended", false);

  const validIds = new Set((profiles ?? []).map((p) => p.id as string));

  const newUserIds = parsed.data.userIds.filter(
    (id) => validIds.has(id) && !existingIds.has(id)
  );

  if (newUserIds.length === 0) {
    return { success: false, message: "Tidak ada user baru yang valid untuk ditugaskan." };
  }

  const { error: assignErr } = await admin.from("bill_assignments").insert(
    newUserIds.map((userId) => ({ bill_id: parsed.data.billId, user_id: userId }))
  );

  if (assignErr) {
    return { success: false, message: "Terjadi kesalahan saat menugaskan tagihan." };
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "bill.assign",
    entityType: "bills",
    entityId: parsed.data.billId,
    detail: { userIds: newUserIds },
  });

  revalidateBillPaths();
  return { success: true };
}
